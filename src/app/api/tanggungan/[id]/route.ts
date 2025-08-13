import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

// GET by id (public) + optional ?withCount=true
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { searchParams } = new URL(req.url);
    const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true';

    const row = await prisma.tanggungan.findUnique({
      where: { id_tanggungan: params.id },
      ...(withCount ? { include: { _count: { select: { users: true } } } } : {}),
    });
    if (!row) {
      return NextResponse.json({ message: 'Tanggungan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// PUT (ADMIN): { nama_tanggungan?, is_active?, alasan_nonaktif? }
import { withRole } from '@/lib/middleware/withRole';
export const PUT = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const data: {
      nama_tanggungan?: string;
      is_active?: boolean;
      alasan_nonaktif?: string | null;
      deletedAt?: Date | null;
    } = {};

    if (typeof body?.nama_tanggungan === 'string') {
      const nm = body.nama_tanggungan.trim();
      if (nm.length < 3) {
        return NextResponse.json({ message: 'Invalid payload: nama_tanggungan' }, { status: 400 });
      }
      data.nama_tanggungan = nm;
    }

    // toggle aktif/nonaktif (sekalian kelola soft-delete)
    if (typeof body?.is_active === 'boolean') {
      data.is_active = body.is_active;
      if (body.is_active === false) {
        data.deletedAt = new Date();
        data.alasan_nonaktif = typeof body?.alasan_nonaktif === 'string' && body.alasan_nonaktif.trim() ? body.alasan_nonaktif.trim() : 'Nonaktif manual';
      } else {
        data.deletedAt = null;
        data.alasan_nonaktif = null;
      }
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });
    }

    const updated = await prisma.tanggungan.update({
      where: { id_tanggungan: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Nama tanggungan sudah ada' }, { status: 409 });
    }
    if (e?.code === 'P2025') {
      return NextResponse.json({ message: 'Tanggungan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

// DELETE (ADMIN): HARD DELETE (permanen)
export const DELETE = withRole('ADMIN')<Ctx>(async (_req, { params }) => {
  try {
    await prisma.tanggungan.delete({
      where: { id_tanggungan: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ message: 'Tanggungan tidak ditemukan' }, { status: 404 });
    }
    if (e?.code === 'P2003') {
      return NextResponse.json({ message: 'Tidak bisa menghapus permanen: masih dipakai entitas lain' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
