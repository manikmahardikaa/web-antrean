import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const { ids, status, alasan_batal } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Daftar id kosong' }, { status: 400 });
    }
    if (!['MENUNGGU', 'DIPROSES', 'SELESAI', 'DIBATALKAN'].includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }
    if (status === 'DIBATALKAN' && !alasan_batal) {
      // untuk bulk, boleh gunakan default alasan jika tak diisi
    }

    const data: any = { status };
    data.alasan_batal = status === 'DIBATALKAN' ? alasan_batal || 'Dibatalkan (bulk)' : null;

    const res = await prisma.antrean.updateMany({
      where: { id_antrean: { in: ids } },
      data,
    });

    return NextResponse.json({ ok: true, count: res.count });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
