import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';
type Ctx = { params: { id: string } };

// GET detail dokter ?withCount=true
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { searchParams } = new URL(req.url);
    const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true';
    const row = await prisma.dokter.findUnique({
      where: { id_dokter: params.id },
      ...(withCount ? { include: { _count: { select: { antrean: true, jadwal_praktik: true, slot_praktik: true } } } } : {}),
    });
    if (!row) return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// PUT: update { nama_dokter?, spesialisasi?, is_active? (toggle) , alasan_nonaktif? }
export const PUT = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (typeof body?.nama_dokter === 'string') {
      const nama = body.nama_dokter.trim();
      if (nama.length < 3) return NextResponse.json({ message: 'nama_dokter terlalu pendek' }, { status: 400 });
      data.nama_dokter = nama;
    }
    if (typeof body?.spesialisasi === 'string') {
      const spes = body.spesialisasi.trim();
      if (!spes) return NextResponse.json({ message: 'spesialisasi wajib diisi' }, { status: 400 });
      data.spesialisasi = spes;
    }
    if (typeof body?.is_active === 'boolean') {
      data.is_active = body.is_active;
      if (body.is_active === false) {
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

// DELETE: hard delete
export const DELETE = withRole('ADMIN')<Ctx>(async (_req, { params }) => {
  try {
    await prisma.dokter.delete({ where: { id_dokter: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });
    if (e?.code === 'P2003') return NextResponse.json({ message: 'Masih direferensikan entitas lain' }, { status: 409 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
