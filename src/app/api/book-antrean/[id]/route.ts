import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

const parseDateOnlyUTC = (s: any) => {
  if (!s) return null;
  if (typeof s === 'string') {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(s);
  if (isNaN(d.valueOf())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

function getUserIdFromTokenPayload(p: any): string | null {
  return p?.id_user || p?.userId || p?.sub || null;
}
const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtHHmm = (d: Date) => `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
const dateOnlyUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const DOW = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function indoLongDateUTC(d: Date) {
  // d adalah Date (jadwal.tanggal = @db.Date -> UTC 00:00)
  return `${DOW[d.getUTCDay()]}, ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function statusWaktuLabel(scheduleDateUTC00: Date) {
  const today = dateOnlyUTC(new Date());
  const diffDays = Math.round((scheduleDateUTC00.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  if (diffDays === 2) return 'Lusa';
  if (diffDays > 2) return `${diffDays} hari lagi`;
  // masa lalu
  if (diffDays === -1) return 'Kemarin';
  return `${Math.abs(diffDays)} hari lalu`;
}

/* ========= GET: detail antrean + ringkasan slot ========= */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Auth
    const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    let payload: any;
    try {
      payload = await verifyToken(m[1]);
    } catch {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const id_user = getUserIdFromTokenPayload(payload);
    if (!id_user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Ambil antrean milik user + slot + jadwal + dokter
    const a = await prisma.antrean.findUnique({
      where: { id_antrean: params.id },
      include: {
        slot: {
          include: {
            jadwal: { include: { dokter: true } },
          },
        },
      },
    });
    if (!a) return NextResponse.json({ message: 'Antrean tidak ditemukan' }, { status: 404 });
    if (a.id_user !== id_user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // Ringkasan slot di antrean yang sama
    const [total_antrean_aktif, sedangDilayani] = await Promise.all([
      prisma.antrean.count({ where: { id_slot: a.id_slot, status: { in: ['MENUNGGU', 'DIPROSES'] } } }),
      prisma.antrean.findFirst({
        where: { id_slot: a.id_slot, status: 'DIPROSES' },
        orderBy: { no_antrean: 'asc' },
        select: { no_antrean: true },
      }),
    ]);

    // Bentuk label tampilan
    const tglUTC = new Date(a.slot.jadwal.tanggal); // @db.Date (UTC 00:00)
    const labelTanggal = indoLongDateUTC(tglUTC);
    const status_waktu = statusWaktuLabel(tglUTC);

    const jm = new Date(a.slot.jadwal.jam_mulai);
    const js = new Date(a.slot.jadwal.jam_selesai);
    const labelJam = `${fmtHHmm(jm)}–${fmtHHmm(js)}`;

    // Notifikasi sederhana — tweak sesuai kebutuhan
    const notif =
      status_waktu === 'Hari ini' || status_waktu === 'Besok' || status_waktu === 'Lusa'
        ? 'Pemeriksaan Anda Mendatang'
        : status_waktu.endsWith('hari lalu') || status_waktu === 'Kemarin'
        ? 'Pemeriksaan Anda Telah Berlalu'
        : 'Informasi Jadwal Pemeriksaan';

    return NextResponse.json({
      // 1) Informasi Jadwal Pemeriksaan (untuk header UI)
      jadwal: {
        tanggal_iso: a.slot.jadwal.tanggal,
        tanggal_label: labelTanggal, // "Senin, 25 Juni 2025"
        jam_label: labelJam, // "07:00–13:00"
        status_waktu, // "Besok" / "Hari ini" / dst
        notif, // "Pemeriksaan Anda Mendatang"
      },

      // 2) Informasi Antrian - Dokter
      dokter: {
        id_dokter: a.slot.jadwal.dokter.id_dokter,
        nama_dokter: a.slot.jadwal.dokter.nama_dokter,
        spesialisasi: a.slot.jadwal.dokter.spesialisasi,
      },

      // 3) Tiga Informasi Antrian
      antrean: {
        no_antrean_anda: a.no_antrean ?? null,
        total_antrean_aktif,
        no_antrean_sedang_dilayani: sedangDilayani?.no_antrean ?? null,
      },

      // (opsional) data mentah jika butuh
      raw: {
        id_antrean: a.id_antrean,
        status: a.status,
        id_slot: a.id_slot,
        createdAt: a.createdAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Auth
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let payload: any;
  try {
    payload = await verifyToken(m[1]);
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requesterId = payload?.id_user || payload?.userId || payload?.sub || null;

  try {
    const res = await prisma.$transaction(async (tx) => {
      // Ambil antrean + pemilik + slot
      const a = await tx.antrean.findUnique({
        where: { id_antrean: params.id },
        select: { id_antrean: true, id_user: true, status: true, id_slot: true },
      });
      if (!a) throw new Error('Antrean tidak ditemukan');

      // Cek role (ADMIN boleh cancel siapa saja)
      let isAdmin = false;
      if (requesterId) {
        const me = await tx.user.findUnique({
          where: { id_user: requesterId },
          select: { role: true },
        });
        isAdmin = me?.role === 'ADMIN';
      }

      if (!isAdmin && a.id_user !== requesterId) {
        const err: any = new Error('Forbidden');
        err.http = 403;
        throw err;
      }

      if (a.status !== 'MENUNGGU') throw new Error('Tidak bisa dibatalkan (status bukan MENUNGGU)');

      // Set DIBATALKAN
      await tx.antrean.update({
        where: { id_antrean: a.id_antrean },
        data: { status: 'DIBATALKAN' },
      });

      // Kembalikan kuota slot secara aman (hindari negatif)
      await tx.slotPraktik.updateMany({
        where: { id_slot: a.id_slot, terisi: { gt: 0 } },
        data: { terisi: { decrement: 1 } },
      });

      return { ok: true };
    });

    return NextResponse.json(res);
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Internal error';
    const code = e?.http ?? (msg === 'Forbidden' ? 403 : msg === 'Antrean tidak ditemukan' ? 404 : msg.startsWith('Tidak bisa dibatalkan') ? 400 : 500);
    return NextResponse.json({ message: msg }, { status: code });
  }
}
