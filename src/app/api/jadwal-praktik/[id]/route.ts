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
    const row = await prisma.jadwalPraktik.findUnique({
      where: { id_jadwal: params.id },
      include: { dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } } },
    });
    if (!row) return NextResponse.json({ message: 'Jadwal tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// PUT update { id_dokter?, tanggal?, jam_mulai?, jam_selesai? }
export const PUT = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const data: any = {};
    if (typeof body?.id_dokter === 'string' && body.id_dokter.trim()) data.id_dokter = body.id_dokter.trim();
    if (body?.tanggal) {
      const t = new Date(body.tanggal);
      if (isNaN(t.valueOf())) return NextResponse.json({ message: 'tanggal tidak valid' }, { status: 400 });
      data.tanggal = t;
    }
    if (body?.jam_mulai) {
      const jm = new Date(body.jam_mulai);
      if (isNaN(jm.valueOf())) return NextResponse.json({ message: 'jam_mulai tidak valid' }, { status: 400 });
      data.jam_mulai = jm;
    }
    if (body?.jam_selesai) {
      const js = new Date(body.jam_selesai);
      if (isNaN(js.valueOf())) return NextResponse.json({ message: 'jam_selesai tidak valid' }, { status: 400 });
      data.jam_selesai = js;
    }
    if (data.jam_mulai && data.jam_selesai && data.jam_selesai <= data.jam_mulai) return NextResponse.json({ message: 'jam_selesai harus > jam_mulai' }, { status: 400 });
    if (!Object.keys(data).length) return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });

    const updated = await prisma.jadwalPraktik.update({ where: { id_jadwal: params.id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Jadwal tidak ditemukan' }, { status: 404 });
    if (e?.code === 'P2003') return NextResponse.json({ message: 'id_dokter tidak valid' }, { status: 400 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

// DELETE: hard delete
export const DELETE = withRole('ADMIN')<Ctx>(async (_req, { params }) => {
  try {
    await prisma.jadwalPraktik.delete({ where: { id_jadwal: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Jadwal tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
