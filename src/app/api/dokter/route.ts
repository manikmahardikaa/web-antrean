import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';

// GET: list dokter
// ?q=... (nama/spesialisasi, contains)
// ?status=active|inactive|all (default: active)
// ?spec=... (spesialisasi persis)
// ?withCount=true (kembalikan _count antrean & jadwal_praktik & slot_praktik)
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
      ...(withCount ? { include: { _count: { select: { antrean: true, jadwal_praktik: true, slot_praktik: true } } } } : {}),
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// POST: create dokter { nama_dokter, spesialisasi }
export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const nama = (body?.nama_dokter || '').toString().trim();
    const spesialisasi = (body?.spesialisasi || '').toString().trim();

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
