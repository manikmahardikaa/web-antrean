import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { status, alasan_batal } = await req.json();

    if (!['MENUNGGU', 'DIPROSES', 'SELESAI', 'DIBATALKAN'].includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }
    if (status === 'DIBATALKAN' && !alasan_batal) {
      return NextResponse.json({ message: 'Alasan batal wajib diisi' }, { status: 400 });
    }

    const data: any = { status };
    data.alasan_batal = status === 'DIBATALKAN' ? alasan_batal || 'Dibatalkan' : null;

    const row = await prisma.antrean.update({
      where: { id_antrean: params.id },
      data,
    });

    return NextResponse.json(row);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Antrean tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
