import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import { supabaseAdmin } from '@/utils/supaBaseAdmin';

export const runtime = 'nodejs';

const BUCKET = 'video_news';

function parseDateOnlyUTC(v: any): Date | null {
  if (!v) return null;
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(v);
  if (isNaN(d.valueOf())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Ekstrak relative path dari public URL Supabase */
function extractPathFromPublicUrl(publicUrl: string | null | undefined, bucket = BUCKET): string | null {
  if (!publicUrl) return null;
  try {
    const u = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.substring(idx + marker.length));
  } catch {
    return null;
  }
}

/** GET detail */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const row = await prisma.videoKesehatan.findUnique({ where: { id_video: params.id } });
    if (!row) return NextResponse.json({ message: 'Video tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

/**
 * PUT update (ADMIN)
 * Dukung JSON dan multipart:
 *  - JSON: { judul?, deskripsi?, tanggal_penerbitan?, video_url?(string|null) }
 *  - multipart: fields judul?, deskripsi?, tanggal_penerbitan?, file?(video)
 *    -> jika file baru dikirim, upload & hapus file lama (jika ada)
 */
export const PUT = withRole('ADMIN')(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const existing = await prisma.videoKesehatan.findUnique({ where: { id_video: params.id } });
    if (!existing) return NextResponse.json({ message: 'Video tidak ditemukan' }, { status: 404 });

    const ct = req.headers.get('content-type') || '';
    const data: any = {};

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const judul = form.get('judul');
      const deskripsi = form.get('deskripsi');
      const tglStr = form.get('tanggal_penerbitan');
      const file = form.get('file') as File | null;

      if (typeof judul === 'string') data.judul = judul.trim();
      if (typeof deskripsi === 'string') data.deskripsi = deskripsi.trim();
      if (tglStr) {
        const t = parseDateOnlyUTC(tglStr);
        if (!t) return NextResponse.json({ message: 'tanggal_penerbitan tidak valid (YYYY-MM-DD)' }, { status: 400 });
        data.tanggal_penerbitan = t;
      }

      if (file && file.size > 0) {
        if (!file.type.startsWith('video/')) return NextResponse.json({ message: 'Hanya file video yang diizinkan' }, { status: 400 });
        if (file.size > 50 * 1024 * 1024) return NextResponse.json({ message: 'Ukuran file maksimal 50MB' }, { status: 400 });

        const ext = (file.type.split('/')[1] || 'mp4').replace(/[^a-z0-9]/gi, '').toLowerCase();
        const path = `${existing.id_video}/video_${Date.now()}.${ext}`;
        const ab = await file.arrayBuffer();
        const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, new Uint8Array(ab), {
          contentType: file.type,
          upsert: true,
        });
        if (error) return NextResponse.json({ message: 'Upload gagal', error: error.message }, { status: 400 });

        const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
        data.video_url = pub.publicUrl;

        // hapus file lama (jika ada & sama bucket)
        const oldPath = extractPathFromPublicUrl(existing.video_url);
        if (oldPath) await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.judul === 'string') data.judul = body.judul.trim();
      if (typeof body?.deskripsi === 'string') data.deskripsi = body.deskripsi.trim();
      if (body?.tanggal_penerbitan !== undefined) {
        const t = parseDateOnlyUTC(body.tanggal_penerbitan);
        if (!t) return NextResponse.json({ message: 'tanggal_penerbitan tidak valid (YYYY-MM-DD)' }, { status: 400 });
        data.tanggal_penerbitan = t;
      }
      if (body?.video_url !== undefined) {
        // boleh set string (public url lain) atau null (hapus)
        const newUrl = body.video_url === null ? null : String(body.video_url);
        if (newUrl === null) {
          // jika dihapus, hapus file lama pada bucket
          const oldPath = extractPathFromPublicUrl(existing.video_url);
          if (oldPath) await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
        }
        data.video_url = newUrl;
      }
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });
    }

    const updated = await prisma.videoKesehatan.update({
      where: { id_video: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

/** DELETE (ADMIN) – hapus row + file di storage jika ada */
export const DELETE = withRole('ADMIN')(async (_req: Request, { params }: { params: { id: string } }) => {
  try {
    const existing = await prisma.videoKesehatan.findUnique({ where: { id_video: params.id } });
    if (!existing) return NextResponse.json({ message: 'Video tidak ditemukan' }, { status: 404 });

    // hapus file lama bila ada
    const oldPath = extractPathFromPublicUrl(existing.video_url);
    if (oldPath) {
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([oldPath])
        .catch(() => {});
    }

    await prisma.videoKesehatan.delete({ where: { id_video: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});