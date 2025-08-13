import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id_dokter } = await req.json();
    if (!id_dokter) return NextResponse.json({ message: 'id_dokter wajib' }, { status: 400 });

    const dokter = await prisma.dokter.findUnique({
      where: { id_dokter },
      select: { nama_dokter: true },
    });
    if (!dokter) return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });

    const row = await prisma.antrean.update({
      where: { id_antrean: params.id },
      data: { id_dokter, dokter_nama_snapshot: dokter.nama_dokter },
    });

    return NextResponse.json(row);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Antrean tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
