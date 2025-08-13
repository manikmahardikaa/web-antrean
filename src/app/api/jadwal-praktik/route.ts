import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';

// GET list jadwal
// ?q=... (nama dokter/spesialisasi)
// ?id_dokter=... (filter by dokter)
// ?tanggal=YYYY-MM-DD (hari spesifik)
// ?from=YYYY-MM-DD&to=YYYY-MM-DD (range tanggal, inclusive)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const id_dokter = (searchParams.get('id_dokter') || '').trim();
    const tanggal = (searchParams.get('tanggal') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    const where: any = {};
    if (id_dokter) where.id_dokter = id_dokter;

    if (tanggal) {
      const day = new Date(tanggal);
      if (!isNaN(day.valueOf())) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        where.tanggal = { gte: start, lte: end };
      }
    } else if (from || to) {
      const f = from ? new Date(from) : undefined;
      const t = to ? new Date(to) : undefined;
      where.tanggal = {
        ...(f && !isNaN(f.valueOf()) ? { gte: f } : {}),
        ...(t && !isNaN(t.valueOf()) ? { lte: t } : {}),
      };
    }

    if (q) {
      where.dokter = {
        OR: [{ nama_dokter: { contains: q } }, { spesialisasi: { contains: q } }],
      };
    }

    const rows = await prisma.jadwalPraktik.findMany({
      where,
      orderBy: [{ tanggal: 'asc' }, { jam_mulai: 'asc' }],
      include: { dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } } },
    });

    // Flatten optional fields for convenience (opsional)
    const data = rows.map((r) => ({
      ...r,
      nama_dokter: r.dokter?.nama_dokter,
      spesialisasi: r.dokter?.spesialisasi,
    }));

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// POST create { id_dokter, tanggal, jam_mulai, jam_selesai }
export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const id_dokter = (body?.id_dokter || '').toString().trim();
    const tanggal = new Date(body?.tanggal);
    const jam_mulai = new Date(body?.jam_mulai);
    const jam_selesai = new Date(body?.jam_selesai);

    if (!id_dokter) return NextResponse.json({ message: 'id_dokter wajib' }, { status: 400 });
    if ([tanggal, jam_mulai, jam_selesai].some((d) => isNaN(d.valueOf()))) return NextResponse.json({ message: 'tanggal/jam tidak valid' }, { status: 400 });
    if (jam_selesai <= jam_mulai) return NextResponse.json({ message: 'jam_selesai harus > jam_mulai' }, { status: 400 });

    const created = await prisma.jadwalPraktik.create({
      data: { id_dokter, tanggal, jam_mulai, jam_selesai },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2003') return NextResponse.json({ message: 'id_dokter tidak valid' }, { status: 400 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
