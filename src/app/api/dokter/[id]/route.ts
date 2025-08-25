import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import { supabaseAdmin } from '@/utils/supaBaseAdmin';

type Ctx = { params: { id: string } };

export const runtime = 'nodejs';

// helper: ambil path relatif dari public URL
function storagePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null;
  const marker = '/dokter_profile/';
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.substring(i + marker.length); // contoh: "<id>/profile_123.png"
}

// GET detail dokter ?withCount=true
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { searchParams } = new URL(req.url);
    const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true';

    const row = await prisma.dokter.findUnique({
      where: { id_dokter: params.id },
      ...(withCount ? { include: { _count: { select: { antrean: true, jadwal_praktik: true } } } } : {}),
    });

    if (!row) return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// PUT: update dokter (JSON / multipart)
// multipart fields yang didukung: nama_dokter, spesialisasi, is_active ('true'|'false'|'1'|'0'), alasan_nonaktif, file
export const PUT = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const ct = req.headers.get('content-type') || '';
    const dokter = await prisma.dokter.findUnique({ where: { id_dokter: params.id } });
    if (!dokter) return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });

    // === multipart/form-data ===
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const nama = form.get('nama_dokter');
      const spesialisasi = form.get('spesialisasi');
      const is_active = form.get('is_active');
      const alasan_nonaktif = form.get('alasan_nonaktif');
      const file = form.get('file') as File | null;

      const data: any = {};
      if (typeof nama === 'string' && nama.trim().length >= 3) data.nama_dokter = nama.trim();
      if (typeof spesialisasi === 'string' && spesialisasi.trim()) data.spesialisasi = spesialisasi.trim();

      if (typeof is_active === 'string') {
        const bool = is_active === 'true' || is_active === '1';
        data.is_active = bool;
        if (!bool) {
          data.deletedAt = new Date();
          data.alasan_nonaktif = typeof alasan_nonaktif === 'string' ? alasan_nonaktif.trim() || 'Nonaktif manual' : 'Nonaktif manual';
        } else {
          data.deletedAt = null;
          data.alasan_nonaktif = null;
        }
      }

      let updated = Object.keys(data).length ? await prisma.dokter.update({ where: { id_dokter: params.id }, data }) : dokter;

      // upload foto (opsional)
      if (file && file.size > 0) {
        if (!file.type.startsWith('image/')) return NextResponse.json({ message: 'Hanya file gambar yang diizinkan' }, { status: 400 });
        if (file.size > 2 * 1024 * 1024) return NextResponse.json({ message: 'Ukuran file maksimal 2MB' }, { status: 400 });

        const ext = (file.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase();
        const path = `${params.id}/profile_${Date.now()}.${ext}`;

        const ab = await file.arrayBuffer();
        const { error } = await supabaseAdmin.storage.from('dokter_profile').upload(path, new Uint8Array(ab), { contentType: file.type, upsert: true });

        if (error) {
          // simpan bagian non-file berhasil, tetapi beri warning upload
          return NextResponse.json({ ...updated, _uploadWarning: error.message });
        }

        // opsional: hapus foto lama bila ada
        const oldRelPath = storagePathFromPublicUrl(updated.foto_profil_dokter);
        if (oldRelPath) {
          await supabaseAdmin.storage
            .from('dokter_profile')
            .remove([oldRelPath])
            .catch(() => {});
        }

        const { data: pub } = supabaseAdmin.storage.from('dokter_profile').getPublicUrl(path);
        updated = await prisma.dokter.update({
          where: { id_dokter: params.id },
          data: { foto_profil_dokter: pub.publicUrl },
        });
      }

      return NextResponse.json(updated);
    }

    // === JSON ===
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (typeof body?.nama_dokter === 'string' && body.nama_dokter.trim().length >= 3) data.nama_dokter = body.nama_dokter.trim();
    if (typeof body?.spesialisasi === 'string' && body.spesialisasi.trim()) data.spesialisasi = body.spesialisasi.trim();

    if (typeof body?.is_active === 'boolean') {
      data.is_active = body.is_active;
      if (!body.is_active) {
        data.deletedAt = new Date();
        data.alasan_nonaktif = body?.alasan_nonaktif?.toString().trim() || 'Nonaktif manual';
      } else {
        data.deletedAt = null;
        data.alasan_nonaktif = null;
      }
    }

    if (!Object.keys(data).length) return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });

    const updated = await prisma.dokter.update({ where: { id_dokter: params.id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

// DELETE: hapus dokter (hard delete) + coba bersihkan foto di storage
export const DELETE = withRole('ADMIN')<Ctx>(async (_req, { params }) => {
  try {
    const dokter = await prisma.dokter.findUnique({ where: { id_dokter: params.id } });
    if (!dokter) return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });

    // hapus foto di storage (opsional, best-effort)
    const rel = storagePathFromPublicUrl(dokter.foto_profil_dokter);
    if (rel) {
      await supabaseAdmin.storage
        .from('dokter_profile')
        .remove([rel])
        .catch(() => {});
    }

    await prisma.dokter.delete({ where: { id_dokter: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });
    if (e?.code === 'P2003') return NextResponse.json({ message: 'Masih direferensikan entitas lain' }, { status: 409 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
