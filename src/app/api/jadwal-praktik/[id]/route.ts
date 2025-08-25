import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';
type Ctx = { params: { id: string } };

/** ---------- Helpers aman timezone ---------- */
function parseDateOnlyUTC(v: any): Date | null {
  if (!v) return null;
  if (typeof v === 'string') {
    // dukung "YYYY-MM-DD"
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(v);
  if (isNaN(d.valueOf())) return null;
  // ambil bagian tanggal (UTC) dan pakukan ke UTC 00:00
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseTimeToUTCDate(v: any): Date | null {
  if (!v) return null;
  if (typeof v === 'string') {
    // dukung "HH:mm" atau "HH:mm:ss"
    const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      const h = +m[1],
        mi = +m[2],
        s = m[3] ? +m[3] : 0;
      if (h >= 0 && h < 24 && mi >= 0 && mi < 60 && s >= 0 && s < 60) {
        return new Date(Date.UTC(1970, 0, 1, h, mi, s));
      }
    }
  }
  const d = new Date(v);
  if (isNaN(d.valueOf())) return null;
  // normalisasi ke anchor 1970-01-01 (UTC) dgn jam-menit yang sama
  return new Date(Date.UTC(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
}

// Jika kolom jam_* kamu pakai STRING @db.Time, pakai ini:
// function formatTimeHHmmss(d: Date): string {
//   const pad = (n: number) => String(n).padStart(2, '0');
//   return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
// }

/** ---------- GET detail ---------- */
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

/** ---------- PUT update ---------- */
export const PUT = withRole('ADMIN')<Ctx>(async (req, { params }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (typeof body?.id_dokter === 'string' && body.id_dokter.trim()) {
      data.id_dokter = body.id_dokter.trim();
    }

    if (body?.tanggal !== undefined) {
      const t = parseDateOnlyUTC(body.tanggal);
      if (!t) return NextResponse.json({ message: 'tanggal tidak valid' }, { status: 400 });
      data.tanggal = t; // kolom @db.Date → aman dari offset
    }

    if (body?.jam_mulai !== undefined) {
      const jm = parseTimeToUTCDate(body.jam_mulai);
      if (!jm) return NextResponse.json({ message: 'jam_mulai tidak valid' }, { status: 400 });
      data.jam_mulai = jm;
      // Jika pakai kolom String @db.Time, gunakan:
      // data.jam_mulai = formatTimeHHmmss(jm);
    }

    if (body?.jam_selesai !== undefined) {
      const js = parseTimeToUTCDate(body.jam_selesai);
      if (!js) return NextResponse.json({ message: 'jam_selesai tidak valid' }, { status: 400 });
      data.jam_selesai = js;
      // Jika pakai kolom String @db.Time:
      // data.jam_selesai = formatTimeHHmmss(js);
    }

    // Validasi jam_selesai > jam_mulai (kedua-duanya di anchor yg sama)
    const jm = data.jam_mulai ?? undefined;
    const js = data.jam_selesai ?? undefined;
    if (jm && js && js <= jm) {
      return NextResponse.json({ message: 'jam_selesai harus > jam_mulai' }, { status: 400 });
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });
    }

    const updated = await prisma.jadwalPraktik.update({ where: { id_jadwal: params.id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Jadwal tidak ditemukan' }, { status: 404 });
    if (e?.code === 'P2003') return NextResponse.json({ message: 'id_dokter tidak valid' }, { status: 400 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

/** ---------- DELETE ---------- */
export const DELETE = withRole('ADMIN')<Ctx>(async (_req, { params }) => {
  try {
    await prisma.jadwalPraktik.delete({ where: { id_jadwal: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ message: 'Jadwal tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
