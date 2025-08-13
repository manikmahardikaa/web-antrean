import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';

// GET list slot
// ?status=active|inactive|all (default: active)
// ?id_dokter=... (filter via jadwal.id_dokter)
// ?id_jadwal=...
// ?tanggal=YYYY-MM-DD (dari jadwal.tanggal) atau ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ?q=... (search nama_dokter/spesialisasi)
// ?withCount=true (antrean)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'active').toLowerCase();
    const id_dokter = (searchParams.get('id_dokter') || '').trim();
    const id_jadwal = (searchParams.get('id_jadwal') || '').trim();
    const tanggal = (searchParams.get('tanggal') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();
    const q = (searchParams.get('q') || '').trim();
    const withCount = (searchParams.get('withCount') || '').toLowerCase() === 'true';

    const where: any = {};

    if (status === 'active') where.is_active = true;
    else if (status === 'inactive') where.is_active = false;

    if (id_jadwal) where.id_jadwal = id_jadwal;

    // filter via relasi ke jadwal & dokter
    where.jadwal = {};
    if (id_dokter) where.jadwal.id_dokter = id_dokter;

    if (tanggal) {
      const day = new Date(tanggal);
      if (!isNaN(day.valueOf())) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        where.jadwal.tanggal = { gte: start, lte: end };
      }
    } else if (from || to) {
      const f = from ? new Date(from) : undefined;
      const t = to ? new Date(to) : undefined;
      where.jadwal.tanggal = {
        ...(f && !isNaN(f.valueOf()) ? { gte: f } : {}),
        ...(t && !isNaN(t.valueOf()) ? { lte: t } : {}),
      };
    }

    if (q) {
      where.jadwal.dokter = {
        OR: [{ nama_dokter: { contains: q } }, { spesialisasi: { contains: q } }],
      };
    }

    const rows = await prisma.slotPraktik.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        jadwal: {
          include: { dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } } },
        },
        ...(withCount ? { _count: { select: { antrean: true } } } : {}),
      },
    });

    // Flatten biar UI lama tetap jalan (tanggal/jam turun dari jadwal)
    const data = rows.map((r) => ({
      id_slot: r.id_slot,
      id_jadwal: r.id_jadwal,
      kapasitas: r.kapasitas,
      is_active: r.is_active,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      // turunan untuk tampilan:
      id_dokter: r.jadwal.dokter.id_dokter,
      terisi: r.terisi,
      sisa: Math.max(0, r.kapasitas - r.terisi),
      nama_dokter: r.jadwal.dokter.nama_dokter,
      spesialisasi: r.jadwal.dokter.spesialisasi,
      tanggal: r.jadwal.tanggal,
      jam_mulai: r.jadwal.jam_mulai,
      jam_selesai: r.jadwal.jam_selesai,
      _count: (r as any)._count, // kalau withCount
    }));

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

// POST: { id_jadwal, kapasitas, is_active? }
export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const id_jadwal = (body?.id_jadwal || '').toString().trim();
    const kapasitas = Number.isFinite(body?.kapasitas) ? Number(body.kapasitas) : 1;
    const is_active = typeof body?.is_active === 'boolean' ? body.is_active : true;

    if (!id_jadwal) return NextResponse.json({ message: 'id_jadwal wajib' }, { status: 400 });
    if (!(kapasitas >= 1)) return NextResponse.json({ message: 'kapasitas minimal 1' }, { status: 400 });

    const created = await prisma.slotPraktik.create({
      data: { id_jadwal, kapasitas, is_active },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ message: 'Slot untuk jadwal ini sudah ada' }, { status: 409 });
    if (e?.code === 'P2003') return NextResponse.json({ message: 'id_jadwal tidak valid' }, { status: 400 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
