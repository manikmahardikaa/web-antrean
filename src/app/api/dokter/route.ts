import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import { supabaseAdmin } from '@/utils/supaBaseAdmin';

export const runtime = 'nodejs';

// GET: list dokter
// Query:
//  - q: string (search pada nama_dokter / spesialisasi)
//  - status: 'active' | 'inactive' | 'all' (default 'active')
//  - spec: string (spesialisasi persis)
//  - withCount: 'true' | 'false' (kembalikan _count antrean & jadwal_praktik)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const status = (searchParams.get('status') || 'active').toLowerCase();
    const spec = (searchParams.get('spec') || '').trim();
    const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true';

    const qFilter = q ? { OR: [{ nama_dokter: { contains: q } }, { spesialisasi: { contains: q } }] } : {};
    const specFilter = spec ? { spesialisasi: spec } : {};

    let where: any = { ...qFilter, ...specFilter };
    if (status === 'active') where = { ...where, is_active: true, deletedAt: null };
    else if (status === 'inactive') where = { ...where, OR: [{ is_active: false }, { deletedAt: { not: null } }] };

    const rows = await prisma.dokter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(withCount ? { include: { _count: { select: { antrean: true, jadwal_praktik: true } } } } : {}),
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// POST: create dokter (JSON atau multipart)
//  - JSON body: { nama_dokter, spesialisasi }
//  - multipart form-data fields: nama_dokter, spesialisasi, file (opsional)
export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const ct = req.headers.get('content-type') || '';

    // === multipart/form-data ===
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const nama = String(form.get('nama_dokter') || '').trim();
      const spesialisasi = String(form.get('spesialisasi') || '').trim();
      const file = form.get('file') as File | null;

      if (nama.length < 3) return NextResponse.json({ message: 'nama_dokter minimal 3 karakter' }, { status: 400 });
      if (!spesialisasi) return NextResponse.json({ message: 'spesialisasi wajib diisi' }, { status: 400 });

      // buat row dokter dulu
      const created = await prisma.dokter.create({
        data: { nama_dokter: nama, spesialisasi, is_active: true, deletedAt: null, alasan_nonaktif: null },
      });

      // ada file ⇒ validasi & upload via service role
      if (file && file.size > 0) {
        if (!file.type.startsWith('image/')) return NextResponse.json({ message: 'Hanya file gambar yang diizinkan' }, { status: 400 });
        if (file.size > 2 * 1024 * 1024) return NextResponse.json({ message: 'Ukuran file maksimal 2MB' }, { status: 400 });

        const ext = (file.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase();
        const path = `${created.id_dokter}/profile_${Date.now()}.${ext}`;

        const ab = await file.arrayBuffer();
        const { error } = await supabaseAdmin.storage.from('dokter_profile').upload(path, new Uint8Array(ab), { contentType: file.type, upsert: true });

        if (error) {
          // simpan row tanpa foto, tapi beri warning agar client tahu
          return NextResponse.json({ ...created, _uploadWarning: error.message }, { status: 201 });
        }

        const { data: pub } = supabaseAdmin.storage.from('dokter_profile').getPublicUrl(path);
        const updated = await prisma.dokter.update({
          where: { id_dokter: created.id_dokter },
          data: { foto_profil_dokter: pub.publicUrl },
        });
        return NextResponse.json(updated, { status: 201 });
      }

      // tanpa file
      return NextResponse.json(created, { status: 201 });
    }

    // === JSON ===
    const body = await req.json().catch(() => ({}));
    const nama = String(body?.nama_dokter || '').trim();
    const spesialisasi = String(body?.spesialisasi || '').trim();

    if (nama.length < 3) return NextResponse.json({ message: 'nama_dokter minimal 3 karakter' }, { status: 400 });
    if (!spesialisasi) return NextResponse.json({ message: 'spesialisasi wajib diisi' }, { status: 400 });

    const created = await prisma.dokter.create({
      data: { nama_dokter: nama, spesialisasi, is_active: true, deletedAt: null, alasan_nonaktif: null },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
