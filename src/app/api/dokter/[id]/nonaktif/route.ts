import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';

export const runtime = 'nodejs';
type Ctx = { params: { id: string } };

export const POST = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const alasan = (body?.alasan_nonaktif || 'Nonaktif manual').toString().trim();
    const updated = await prisma.dokter.update({
      where: { id_dokter: params.id },
      data: { is_active: false, deletedAt: new Date(), alasan_nonaktif: alasan },
    });
    // NOTE: tindak lanjut antrean/slot/jadwal bisa ditambahkan di sini sesuai kebutuhan.
    return NextResponse.json({ ok: true, dokter: updated });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
