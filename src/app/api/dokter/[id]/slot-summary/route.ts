// app/api/dokter/[id]/slot-summary/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Ctx = { params: { id: string } };
export const runtime = 'nodejs';

// Hitung awal & akhir hari (berdasar waktu server)
function getDayRange(dateStr?: string) {
  if (dateStr) {
    const start = new Date(`${dateStr}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(req: Request, { params }: Ctx) {
  // ===== Auth pakai verifyToken =====
  try {
    const authz = req.headers.get('authorization') || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);

    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // ===== Business logic =====
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || undefined; // YYYY-MM-DD
    const scope = (searchParams.get('scope') || 'all').toLowerCase(); // all | upcoming
    const { start, end } = getDayRange(dateParam);
    const now = new Date();

    const slots = await prisma.slotPraktik.findMany({
      where: {
        is_active: true,
        jadwal: {
          id_dokter: params.id,
          tanggal: { gte: start, lt: end },
        },
      },
      select: {
        id_slot: true,
        kapasitas: true,
        terisi: true,
        jadwal: { select: { jam_mulai: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const sisa = (k = 0, t = 0) => Math.max(0, k - t);

    // Ringkasan semua slot hari itu
    const all_total_slot = slots.length;
    const all_total_kapasitas = sum(slots.map((s) => s.kapasitas || 0));
    const all_total_terisi = sum(slots.map((s) => s.terisi || 0));
    const all_total_sisa = sum(slots.map((s) => sisa(s.kapasitas, s.terisi)));

    // Ringkasan slot yang belum mulai (upcoming)
    const upcoming = slots.filter((s) => (s.jadwal?.jam_mulai ?? now) >= now);
    const up_total_slot = upcoming.length;
    const up_total_kapasitas = sum(upcoming.map((s) => s.kapasitas || 0));
    const up_total_terisi = sum(upcoming.map((s) => s.terisi || 0));
    const up_total_sisa = sum(upcoming.map((s) => sisa(s.kapasitas, s.terisi)));
    const nearest_slot_at = upcoming.length ? new Date(Math.min(...upcoming.map((s) => new Date(s.jadwal!.jam_mulai).getTime()))).toISOString() : null;

    const dateOut = (dateParam ? new Date(`${dateParam}T00:00:00`) : start).toISOString().slice(0, 10);

    const payload: any = {
      id_dokter: params.id,
      date: dateOut,
      all: {
        total_slot: all_total_slot,
        total_kapasitas: all_total_kapasitas,
        total_terisi: all_total_terisi,
        total_sisa: all_total_sisa,
      },
      upcoming: {
        total_slot: up_total_slot,
        total_kapasitas: up_total_kapasitas,
        total_terisi: up_total_terisi,
        total_sisa: up_total_sisa,
        nearest_slot_at,
      },
    };

    // Pangkas output sesuai scope
    if (scope === 'upcoming') delete payload.all;
    else if (scope === 'all') delete payload.upcoming;

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
