import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;
export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

// GET by id (public)
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const row = await prisma.layanan.findUnique({
      where: { id_layanan: params.id },
    });
    if (!row) {
      return NextResponse.json({ message: 'Layanan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// PUT (ADMIN): { nama_layanan?, is_active?, alasan_nonaktif? }
export const PUT = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const data: {
      nama_layanan?: string;
      is_active?: boolean;
      alasan_nonaktif?: string | null;
      deletedAt?: Date | null;
    } = {};

    if (typeof body?.nama_layanan === 'string') {
      const nm = body.nama_layanan.trim();
      if (nm.length < 3) {
        return NextResponse.json({ message: 'Invalid payload: nama_layanan' }, { status: 400 });
      }
      data.nama_layanan = nm;
    }

    // toggle aktif/nonaktif
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

    const updated = await prisma.layanan.update({
      where: { id_layanan: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Nama layanan sudah ada' }, { status: 409 });
    }
    if (e?.code === 'P2025') {
      return NextResponse.json({ message: 'Layanan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

// DELETE (ADMIN): HARD DELETE (permanen)
export const DELETE = withRole('ADMIN')<Ctx>(async (_req, { params }) => {
  try {
    await prisma.layanan.delete({
      where: { id_layanan: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ message: 'Layanan tidak ditemukan' }, { status: 404 });
    }
    if (e?.code === 'P2003') {
      // foreign key constraint failed
      return NextResponse.json({ message: 'Tidak bisa menghapus permanen: masih dipakai entitas lain' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
