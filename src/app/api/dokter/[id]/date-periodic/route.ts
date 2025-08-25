import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

/* ---------- Helpers ---------- */
function parseDateOnlyUTC(v: any): Date | null {
  if (!v) return null;
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(v);
  if (isNaN(d.valueOf())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function parseTimeToUTCAnchor(v: any): Date | null {
  if (!v) return null;
  if (typeof v === 'string') {
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
  return new Date(Date.UTC(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
}
function secondsSinceMidnightUTC(d: Date): number {
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
}
const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtHHmm = (d: Date) => `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
const fmtYMD = (d: Date) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

/**
 * GET /api/dokter/[id]/by-datetime
 * Query (semua opsional):
 *  - start=YYYY-MM-DD
 *  - end=YYYY-MM-DD
 *  - time=HH:mm   (titik waktu)
 *    atau
 *  - time_start=HH:mm&time_end=HH:mm  (rentang)
 *  - status=active|all  (default: all)
 *  - onlyAvailable=1    (DIABAIKAN di versi ini, hanya di-echo)
 *
 * Selalu butuh Authorization: Bearer <JWT>
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // --- Auth ---
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    try {
      await verifyToken(m[1]);
    } catch {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_dokter = params.id?.trim();
    if (!id_dokter) return NextResponse.json({ message: 'id_dokter tidak valid' }, { status: 400 });

    // Tanggal (opsional)
    const startStr = (searchParams.get('start') || '').trim();
    const endStr = (searchParams.get('end') || '').trim();
    const startDate = startStr ? parseDateOnlyUTC(startStr) : null;
    const endDate = endStr ? parseDateOnlyUTC(endStr) : null;
    if (startStr && !startDate) return NextResponse.json({ message: 'Format start tidak valid (YYYY-MM-DD)' }, { status: 400 });
    if (endStr && !endDate) return NextResponse.json({ message: 'Format end tidak valid (YYYY-MM-DD)' }, { status: 400 });

    // Waktu (opsional)
    const timeStr = (searchParams.get('time') || '').trim();
    const timeStartStr = (searchParams.get('time_start') || '').trim();
    const timeEndStr = (searchParams.get('time_end') || '').trim();

    let tPoint: number | null = null;
    let tStart: number | null = null;
    let tEnd: number | null = null;

    if (timeStr) {
      const tp = parseTimeToUTCAnchor(timeStr);
      if (!tp) return NextResponse.json({ message: 'Format time tidak valid (HH:mm)' }, { status: 400 });
      tPoint = secondsSinceMidnightUTC(tp);
    } else if (timeStartStr && timeEndStr) {
      const ts = parseTimeToUTCAnchor(timeStartStr);
      const te = parseTimeToUTCAnchor(timeEndStr);
      if (!ts || !te) return NextResponse.json({ message: 'Format time_start/time_end tidak valid (HH:mm)' }, { status: 400 });
      tStart = secondsSinceMidnightUTC(ts);
      tEnd = secondsSinceMidnightUTC(te);
      if (tEnd <= tStart) return NextResponse.json({ message: 'time_end harus > time_start' }, { status: 400 });
    }

    const status = (searchParams.get('status') || 'all').toLowerCase(); // 'active' | 'all'
    const onlyAvailable = (searchParams.get('onlyAvailable') || '') === '1'; // di-echo saja

    // Meta dokter
    const dokter = await prisma.dokter.findUnique({
      where: { id_dokter },
      select: { id_dokter: true, nama_dokter: true, spesialisasi: true, foto_profil_dokter: true, is_active: true, deletedAt: true },
    });
    if (!dokter) return NextResponse.json({ message: 'Dokter tidak ditemukan' }, { status: 404 });
    const dokterAktif = dokter.is_active && !dokter.deletedAt;

    // Query jadwal (termasuk slot jika ada)
    const whereTanggal: any = {};
    if (startDate) whereTanggal.gte = startDate;
    if (endDate) whereTanggal.lte = endDate;

    const jadwals = await prisma.jadwalPraktik.findMany({
      where: { id_dokter, ...(startDate || endDate ? { tanggal: whereTanggal } : {}) },
      include: { slot: true }, // <-- ambil slot untuk kapasitas/terisi
      orderBy: [{ tanggal: 'asc' }, { jam_mulai: 'asc' }],
    });

    // Filter waktu in-memory
    let filtered = jadwals.filter((j) => {
      if (tPoint === null && tStart === null) return true;
      const jmSec = secondsSinceMidnightUTC(new Date(j.jam_mulai));
      const jsSec = secondsSinceMidnightUTC(new Date(j.jam_selesai));
      if (tPoint !== null) return jmSec <= tPoint && tPoint < jsSec;
      return jmSec < (tEnd as number) && jsSec > (tStart as number);
    });

    // status=active → hanya tampil jika dokter aktif
    if (status === 'active') {
      if (!dokterAktif) filtered = [];
    }

    // Mapping ramah UI + kapasitas/terisi
    const jadwalOut = filtered.map((j) => {
      const jm = new Date(j.jam_mulai);
      const js = new Date(j.jam_selesai);
      const tgl = new Date(j.tanggal);

      const slot = j.slot
        ? {
            id_slot: j.slot.id_slot,
            kapasitas: j.slot.kapasitas,
            terisi: j.slot.terisi,
            sisa: Math.max(0, j.slot.kapasitas - j.slot.terisi),
            is_active: j.slot.is_active,
          }
        : null;

      return {
        id_jadwal: j.id_jadwal,
        tanggal: j.tanggal, // ISO
        tanggal_str: fmtYMD(tgl), // "YYYY-MM-DD"
        jam_mulai: j.jam_mulai, // ISO
        jam_selesai: j.jam_selesai, // ISO
        jam_mulai_hhmm: fmtHHmm(jm),
        jam_selesai_hhmm: fmtHHmm(js),
        jam_mulai_sec: secondsSinceMidnightUTC(jm),
        jam_selesai_sec: secondsSinceMidnightUTC(js),

        // Tambahan tampilan kapasitas/terisi (null jika belum ada slot)
        kapasitas: slot ? slot.kapasitas : null,
        terisi: slot ? slot.terisi : null,
        sisa: slot ? slot.sisa : null,

        // Objek slot lengkap (optional di UI)
        slot,
      };
    });

    return NextResponse.json({
      dokter: {
        id_dokter: dokter.id_dokter,
        nama_dokter: dokter.nama_dokter,
        spesialisasi: dokter.spesialisasi,
        foto_profil_dokter: dokter.foto_profil_dokter ?? null,
        is_active: dokterAktif,
      },
      filters_echo: {
        start: startStr || undefined,
        end: endStr || undefined,
        time: timeStr || undefined,
        time_start: timeStartStr || undefined,
        time_end: timeEndStr || undefined,
        status,
        onlyAvailable, // di-echo saja
      },
      jadwal: jadwalOut,
      totals: { total_jadwal: jadwalOut.length },
    });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
