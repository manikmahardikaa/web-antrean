import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const row = await prisma.antrean.findUnique({
      where: { id_antrean: params.id },
      include: {
        user: { select: { id_user: true, nama: true, no_telepon: true } },
        dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } },
        layanan: { select: { id_layanan: true, nama_layanan: true } },
        tanggungan: { select: { id_tanggungan: true, nama_tanggungan: true } },
        slot: true,
      },
    });
    if (!row) return NextResponse.json({ message: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    // batasi field yang boleh diubah disini (lainnya gunakan endpoint khusus)
    const allowed: any = {};
    if (body?.id_layanan) allowed.id_layanan = body.id_layanan;
    if (body?.id_tanggungan !== undefined) allowed.id_tanggungan = body.id_tanggungan || null;
    if (body?.alamat_user) allowed.alamat_user = body.alamat_user;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ message: 'Tidak ada perubahan yang diizinkan' }, { status: 400 });
    }

    const row = await prisma.antrean.update({
      where: { id_antrean: params.id },
      data: allowed,
    });
    return NextResponse.json(row);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Antrean tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.antrean.delete({ where: { id_antrean: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Antrean tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
