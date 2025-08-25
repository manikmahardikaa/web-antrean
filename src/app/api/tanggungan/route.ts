import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';

// GET (public): list + optional ?q=... & ?status=active|inactive|all & ?withCount=true
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const status = (searchParams.get('status') || 'active').toLowerCase();
    const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true';

    // 🔧 Hapus mode:'insensitive' biar kompatibel MySQL/SQLite
    const nameFilter = q ? { nama_tanggungan: { contains: q } } : {};

    let where: any = { ...nameFilter };
    if (status === 'active') {
      where = { ...where, is_active: true, deletedAt: null };
    } else if (status === 'inactive') {
      where = { ...where, OR: [{ is_active: false }, { deletedAt: { not: null } }] };
    }
    // status === 'all' → biarkan hanya nameFilter

    const rows = await prisma.tanggungan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(withCount ? { include: { _count: { select: { users: true } } } } : {}),
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    // (opsional) log biar gampang debug
    // console.error('GET /api/tanggungan error:', e);
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// POST (ADMIN): { nama_tanggungan }

export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const nm = (body?.nama_tanggungan ?? '').toString().trim();

    if (nm.length < 3) {
      return NextResponse.json({ message: 'Invalid payload: nama_tanggungan minimal 3 karakter' }, { status: 400 });
    }

    const created = await prisma.tanggungan.create({
      data: {
        nama_tanggungan: nm,
        is_active: true,
        deletedAt: null,
        alasan_nonaktif: null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Nama tanggungan sudah ada' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
