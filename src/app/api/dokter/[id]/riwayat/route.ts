import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const runtime = 'nodejs';

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 50);

    const rows = await prisma.antrean.findMany({
      where: { slot: { jadwal: { id_dokter: params.id } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id_user: true, nama: true } }, // ganti sesuai schema mu
      },
    });

    const data = rows.map((a) => ({
      id_antrean: a.id_antrean,
      id_user: (a as any).id_user,
      nama: (a as any).user?.nama ?? '—',
      waktu: a.createdAt,
    }));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
