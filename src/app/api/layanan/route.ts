import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;
export const runtime = 'nodejs';

// GET (public): list + optional search ?q=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const status = (searchParams.get('status') || 'active').toLowerCase();

    const nameFilter = q ? { nama_layanan: { contains: q, mode: 'insensitive' as const } } : {};

    let where: any = { ...nameFilter };

    if (status === 'active') {
      where = { ...where, is_active: true, deletedAt: null };
    } else if (status === 'inactive') {
      where = {
        ...where,
        OR: [{ is_active: false }, { deletedAt: { not: null } }],
      };
    }
    // status === 'all' -> tidak tambah filter status

    const rows = await prisma.layanan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// POST (ADMIN): { nama_layanan }
export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const nm = (body?.nama_layanan ?? '').toString().trim();

    if (nm.length < 3) {
      return NextResponse.json({ message: 'Invalid payload: nama_layanan minimal 3 karakter' }, { status: 400 });
    }

    const created = await prisma.layanan.create({
      data: {
        nama_layanan: nm,
        is_active: true,
        deletedAt: null,
        alasan_nonaktif: null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Nama layanan sudah ada' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
