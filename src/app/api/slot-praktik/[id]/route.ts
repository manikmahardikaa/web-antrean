import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';
type Ctx = { params: { id: string } };

// GET detail
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const row = await prisma.slotPraktik.findUnique({
      where: { id_slot: params.id },
      include: {
        jadwal: {
          include: { dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } } },
        },
      },
    });
    if (!row) return NextResponse.json({ message: 'Slot tidak ditemukan' }, { status: 404 });
    return NextResponse.json({
      ...row,
      id_dokter: row.jadwal.dokter.id_dokter,
      nama_dokter: row.jadwal.dokter.nama_dokter,
      spesialisasi: row.jadwal.dokter.spesialisasi,
      sisa: Math.max(0, row.kapasitas - row.terisi),
      tanggal: row.jadwal.tanggal,
      jam_mulai: row.jadwal.jam_mulai,
      jam_selesai: row.jadwal.jam_selesai,
    });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// PUT: { kapasitas?, is_active? } (optional id_jadwal? -> sebaiknya tidak)
export const PUT = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (typeof body?.kapasitas !== 'undefined') {
      const k = Number(body.kapasitas);
      if (!(k >= 1)) return NextResponse.json({ message: 'kapasitas minimal 1' }, { status: 400 });

      const current = await prisma.slotPraktik.findUnique({
        where: { id_slot: params.id },
        select: { terisi: true },
      });
      if (!current) return NextResponse.json({ message: 'Slot tidak ditemukan' }, { status: 404 });

      if (k < current.terisi) {
        return NextResponse.json({ message: `kapasitas (${k}) tidak boleh < terisi (${current.terisi})` }, { status: 400 });
      }
      data.kapasitas = k;
    }

    if (typeof body?.is_active === 'boolean') data.is_active = body.is_active;

    if (!Object.keys(data).length) return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });

    const updated = await prisma.slotPraktik.update({ where: { id_slot: params.id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Slot tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

// DELETE: hard delete
export const DELETE = withRole('ADMIN')<Ctx>(async (_req, { params }) => {
  try {
    await prisma.slotPraktik.delete({ where: { id_slot: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Slot tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
