import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import { supabaseAdmin } from '@/utils/supaBaseAdmin';

export const runtime = 'nodejs';

/* ===== Helpers ===== */
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

const BUCKET = 'image_news';

/**
 * GET /api/berita
 * Query:
 *  - q: string (cari di judul/deskripsi)
 *  - from=YYYY-MM-DD
 *  - to=YYYY-MM-DD
 *  - page=1..  (default 1)
 *  - pageSize=.. (default 20, max 100)
 *  - sort=recent|oldest (default recent)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();
    const sort = (searchParams.get('sort') || 'recent').toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (q) {
      where.OR = [{ judul: { contains: q } }, { deskripsi: { contains: q } }];
    }

    if (from || to) {
      const f = from ? parseDateOnlyUTC(from) : null;
      const t = to ? parseDateOnlyUTC(to) : null;
      where.tanggal_penerbitan = {
        ...(f ? { gte: f } : {}),
        ...(t ? { lte: t } : {}),
      };
    }

    const orderBy = sort === 'oldest' ? [{ tanggal_penerbitan: 'asc' as const }, { createdAt: 'asc' as const }] : [{ tanggal_penerbitan: 'desc' as const }, { createdAt: 'desc' as const }];

    const [rows, total] = await Promise.all([
      prisma.beritaKesehatan.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.beritaKesehatan.count({ where }),
    ]);

    return NextResponse.json({
      data: rows,
      meta: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
    });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

/**
 * POST /api/berita  (ADMIN)
 * Mendukung:
 *  - JSON: { judul, deskripsi, tanggal_penerbitan (YYYY-MM-DD), foto_url? }
 *  - multipart/form-data: fields judul, deskripsi, tanggal_penerbitan, file (image)
 */
export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const ct = req.headers.get('content-type') || '';

    // === multipart ===
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const judul = String(form.get('judul') || '').trim();
      const deskripsi = String(form.get('deskripsi') || '').trim();
      const tgl = parseDateOnlyUTC(form.get('tanggal_penerbitan'));
      const file = form.get('file') as File | null;

      if (!judul) return NextResponse.json({ message: 'judul wajib' }, { status: 400 });
      if (!deskripsi) return NextResponse.json({ message: 'deskripsi wajib' }, { status: 400 });
      if (!tgl) return NextResponse.json({ message: 'tanggal_penerbitan wajib (YYYY-MM-DD)' }, { status: 400 });

      // Buat row dulu (tanpa foto)
      const created = await prisma.beritaKesehatan.create({
        data: { judul, deskripsi, tanggal_penerbitan: tgl, foto_url: '' },
      });

      if (file && file.size > 0) {
        if (!file.type.startsWith('image/')) return NextResponse.json({ message: 'Hanya file gambar yang diizinkan' }, { status: 400 });
        if (file.size > 2 * 1024 * 1024) return NextResponse.json({ message: 'Ukuran file maksimal 2MB' }, { status: 400 });

        const ext = (file.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase();
        const path = `${created.id_berita}/image_${Date.now()}.${ext}`;

        const ab = await file.arrayBuffer();
        const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, new Uint8Array(ab), {
          contentType: file.type,
          upsert: true,
        });
        if (error) {
          return NextResponse.json({ ...created, _uploadWarning: error.message }, { status: 201 });
        }
        const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

        const updated = await prisma.beritaKesehatan.update({
          where: { id_berita: created.id_berita },
          data: { foto_url: pub.publicUrl },
        });
        return NextResponse.json(updated, { status: 201 });
      }

      return NextResponse.json(created, { status: 201 });
    }

    // === JSON ===
    const body = await req.json().catch(() => ({}));
    const judul = String(body?.judul || '').trim();
    const deskripsi = String(body?.deskripsi || '').trim();
    const tgl = parseDateOnlyUTC(body?.tanggal_penerbitan);
    const foto_url = body?.foto_url ? String(body.foto_url) : null;

    if (!judul) return NextResponse.json({ message: 'judul wajib' }, { status: 400 });
    if (!deskripsi) return NextResponse.json({ message: 'deskripsi wajib' }, { status: 400 });
    if (!tgl) return NextResponse.json({ message: 'tanggal_penerbitan wajib (YYYY-MM-DD)' }, { status: 400 });

    const created = await prisma.beritaKesehatan.create({
      data: { judul, deskripsi, tanggal_penerbitan: tgl, foto_url: foto_url || '' },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
