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

export async function POST(req: Request) {
  try {
    // --- Auth ---
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

    const body = await req.json().catch(() => ({}));
    const { tanggal_lahir, nama_pasien, jenis_kelamin, alamat_user, telepon, id_dokter, id_layanan, id_tanggungan, id_slot } = body || {};

    // Validasi dasar
    const dob = parseDateOnlyUTC(tanggal_lahir);
    if (!dob) return NextResponse.json({ message: 'tanggal_lahir wajib (YYYY-MM-DD)' }, { status: 400 });
    if (!String(nama_pasien || '').trim()) return NextResponse.json({ message: 'nama_pasien wajib' }, { status: 400 });
    if (!String(jenis_kelamin || '').trim()) return NextResponse.json({ message: 'jenis_kelamin wajib' }, { status: 400 });
    if (!String(alamat_user || '').trim()) return NextResponse.json({ message: 'alamat_user wajib' }, { status: 400 });
    if (!String(telepon || '').trim()) return NextResponse.json({ message: 'telepon wajib' }, { status: 400 });
    if (!String(id_dokter || '').trim()) return NextResponse.json({ message: 'id_dokter wajib' }, { status: 400 });
    if (!String(id_layanan || '').trim()) return NextResponse.json({ message: 'id_layanan wajib' }, { status: 400 });
    if (!String(id_slot || '').trim()) return NextResponse.json({ message: 'id_slot wajib' }, { status: 400 });

    const namaTrim = String(nama_pasien).trim();
    const jkTrim = String(jenis_kelamin).trim();
    const telTrim = String(telepon).trim();
    const alamatTrim = String(alamat_user).trim();

    // Transaksi atomik
    const created = await prisma.$transaction(async (tx) => {
      // Validasi slot & konsistensi dokter
      const slot = await tx.slotPraktik.findUnique({
        where: { id_slot },
        include: { jadwal: true },
      });
      if (!slot) throw new Error('Slot tidak ditemukan');
      if (!slot.is_active) throw new Error('Slot nonaktif');
      if (slot.jadwal.id_dokter !== id_dokter) throw new Error('Slot tidak sesuai dokter');

      // Cegah duplikat AKTIF untuk identitas pasien pada slot yang sama
      const dupIdentity = await tx.antrean.findFirst({
        where: {
          id_slot,
          nama_pasien: namaTrim,
          tanggal_lahir: dob,
          status: { in: ['MENUNGGU', 'DIPROSES'] },
        },
        select: { id_antrean: true },
      });
      if (dupIdentity) throw new Error('Pasien sudah terdaftar aktif pada slot ini');

      // (Opsional) cegah user sama di slot sama (aktif)
      const dupUserSlot = await tx.antrean.findFirst({
        where: {
          id_user,
          id_slot,
          status: { in: ['MENUNGGU', 'DIPROSES'] },
        },
        select: { id_antrean: true },
      });
      if (dupUserSlot) throw new Error('Anda sudah memiliki antrean aktif pada slot ini');

      // Increment terisi jika masih tersedia (atomik)
      const inc = await tx.slotPraktik.updateMany({
        where: { id_slot, is_active: true, terisi: { lt: slot.kapasitas } },
        data: { terisi: { increment: 1 } },
      });
      if (inc.count === 0) throw new Error('Slot penuh / nonaktif');

      // Baca nilai terisi terkini → jadi no_antrean
      const after = await tx.slotPraktik.findUnique({
        where: { id_slot },
        select: { terisi: true },
      });
      if (!after) throw new Error('Slot tidak ditemukan setelah update');
      const no_antrean = after.terisi; // 1..kapasitas

      // Snapshot nama dokter
      const dokterSnap = await tx.dokter.findUnique({
        where: { id_dokter },
        select: { nama_dokter: true },
      });

      // Buat antrean
      return await tx.antrean.create({
        data: {
          id_user,
          id_dokter,
          id_layanan,
          id_tanggungan: id_tanggungan || null,
          id_slot,
          tanggal_lahir: dob, // @db.Date, snapshot DOB yang diinput
          alamat_user: alamatTrim,

          // snapshot pasien
          nama_pasien: namaTrim,
          jenis_kelamin: jkTrim,
          telepon: telTrim,

          // nomor antrean
          no_antrean,

          // audit
          dokter_nama_snapshot: dokterSnap?.nama_dokter || null,
        },
        select: {
          id_antrean: true,
          id_user: true,
          id_slot: true,
          no_antrean: true,
          status: true,
          tanggal_lahir: true,
          nama_pasien: true,
          jenis_kelamin: true,
          telepon: true,
          alamat_user: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Tangani constraint unik (tergantung skema unik yang kamu pakai)
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Duplikat antrean / melanggar aturan pemesanan' }, { status: 409 });
    }
    const msg = typeof e?.message === 'string' ? e.message : 'Internal error';
    // Bedakan beberapa pesan umum jadi 409 (conflict)
    if (['Slot tidak sesuai dokter', 'Slot penuh / nonaktif', 'Pasien sudah terdaftar aktif pada slot ini', 'Anda sudah memiliki antrean aktif pada slot ini'].includes(msg)) {
      return NextResponse.json({ message: msg }, { status: 409 });
    }
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

// --- util: bangun ringkasan untuk satu slot (tanpa asumsi user punya antrean) ---
async function buildSlotSummary(id_slot: string, id_user: string) {
  const slot = await prisma.slotPraktik.findUnique({
    where: { id_slot },
    include: {
      jadwal: {
        include: {
          dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } },
        },
      },
    },
  });
  if (!slot) return null;

  const [total_antrean, sedangDilayani, antreanAnda] = await Promise.all([
    prisma.antrean.count({
      where: { id_slot, status: { in: ['MENUNGGU', 'DIPROSES'] } },
    }),
    prisma.antrean.findFirst({
      where: { id_slot, status: 'DIPROSES' },
      orderBy: { no_antrean: 'asc' },
      select: { no_antrean: true },
    }),
    prisma.antrean.findFirst({
      where: { id_slot, id_user, status: { in: ['MENUNGGU', 'DIPROSES'] } },
      select: { no_antrean: true },
    }),
  ]);

  return {
    dokter: {
      id_dokter: slot.jadwal.dokter.id_dokter,
      nama_dokter: slot.jadwal.dokter.nama_dokter,
      spesialisasi: slot.jadwal.dokter.spesialisasi,
    },
    slot: {
      id_slot: slot.id_slot,
      tanggal: slot.jadwal.tanggal, // @db.Date (ISO UTC 00:00)
      jam_mulai: slot.jadwal.jam_mulai, // Date
      jam_selesai: slot.jadwal.jam_selesai,
    },
    no_antrean_sedang_dilayani: sedangDilayani?.no_antrean ?? null,
    total_antrean,
    no_antrean_anda: antreanAnda?.no_antrean ?? null,
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtHHmm = (d: Date) => `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
const dateOnlyUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const DOW = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function indoLongDateUTC(d: Date) {
  return `${DOW[d.getUTCDay()]}, ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function statusWaktuLabel(scheduleDateUTC00: Date) {
  const today = dateOnlyUTC(new Date());
  const diffDays = Math.round((scheduleDateUTC00.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  if (diffDays === 2) return 'Lusa';
  if (diffDays > 2) return `${diffDays} hari lagi`;
  if (diffDays === -1) return 'Kemarin';
  return `${Math.abs(diffDays)} hari lalu`;
}

/**
 * GET /api/book-antrean
 * Query:
 *  - status=active|all (default: active → MENUNGGU, DIPROSES)
 *  - limit=number (opsional, default 20)
 *  - id_slot=... (opsional, kalau mau filter ke satu slot)
 *
 * Autentikasi: Authorization: Bearer <JWT>
 * Mengembalikan daftar antrean milik user dengan ringkasan per slot.
 */
export async function GET(req: Request) {
  try {
    // --- Auth ---
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

    // --- Query params ---
    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get('status') || 'active').toLowerCase(); // active|all
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 20))) | 0;
    const id_slot_filter = (searchParams.get('id_slot') || '').trim();

    const where: any = { id_user };
    if (statusParam === 'active') {
      where.status = { in: ['MENUNGGU', 'DIPROSES'] };
    }
    if (id_slot_filter) where.id_slot = id_slot_filter;

    // Ambil antrean user + slot + jadwal + dokter
    const antreans = await prisma.antrean.findMany({
      where,
      include: {
        slot: {
          include: {
            jadwal: { include: { dokter: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (antreans.length === 0) {
      return NextResponse.json({ bookings: [], meta: { count: 0 } });
    }

    // Kumpulkan id_slot unik untuk agregasi ringkasan
    const slotIds = Array.from(new Set(antreans.map((a) => a.id_slot)));

    // Hitung total aktif per slot (MENUNGGU + DIPROSES)
    const totalAktifMap = new Map<string, number>();
    await Promise.all(
      slotIds.map(async (sid) => {
        const total = await prisma.antrean.count({ where: { id_slot: sid, status: { in: ['MENUNGGU', 'DIPROSES'] } } });
        totalAktifMap.set(sid, total);
      })
    );

    // Cari no antrean yang sedang dilayani per slot (status DIPROSES, ambil terkecil)
    const sedangDilayaniMap = new Map<string, number | null>();
    await Promise.all(
      slotIds.map(async (sid) => {
        const curr = await prisma.antrean.findFirst({
          where: { id_slot: sid, status: 'DIPROSES' },
          orderBy: { no_antrean: 'asc' },
          select: { no_antrean: true },
        });
        sedangDilayaniMap.set(sid, curr?.no_antrean ?? null);
      })
    );

    // Bentuk response untuk setiap antrean user
    const bookings = antreans.map((a) => {
      const jadwal = a.slot.jadwal;
      const tglUTC = new Date(jadwal.tanggal); // @db.Date (UTC 00:00)
      const labelTanggal = indoLongDateUTC(tglUTC);
      const status_waktu = statusWaktuLabel(tglUTC);
      const jm = new Date(jadwal.jam_mulai);
      const js = new Date(jadwal.jam_selesai);
      const labelJam = `${fmtHHmm(jm)}–${fmtHHmm(js)}`;

      const notif =
        status_waktu === 'Hari ini' || status_waktu === 'Besok' || status_waktu === 'Lusa'
          ? 'Pemeriksaan Anda Mendatang'
          : status_waktu.endsWith('hari lalu') || status_waktu === 'Kemarin'
          ? 'Pemeriksaan Anda Telah Berlalu'
          : 'Informasi Jadwal Pemeriksaan';

      return {
        id_antrean: a.id_antrean,
        status: a.status,
        jadwal: {
          tanggal_iso: jadwal.tanggal,
          tanggal_label: labelTanggal,
          jam_label: labelJam,
          status_waktu,
          notif,
        },
        dokter: {
          id_dokter: jadwal.dokter.id_dokter,
          nama_dokter: jadwal.dokter.nama_dokter,
          spesialisasi: jadwal.dokter.spesialisasi,
        },
        antrean: {
          no_antrean_anda: a.no_antrean ?? null,
          total_antrean_aktif: totalAktifMap.get(a.id_slot) ?? 0,
          no_antrean_sedang_dilayani: sedangDilayaniMap.get(a.id_slot) ?? null,
        },
        slot: {
          id_slot: a.id_slot,
          tanggal: jadwal.tanggal,
          jam_mulai: jadwal.jam_mulai,
          jam_selesai: jadwal.jam_selesai,
        },
        // (opsional) snapshot pasien bila perlu ditampilkan di mobile:
        pasien: {
          nama_pasien: a.nama_pasien,
          jenis_kelamin: a.jenis_kelamin,
          telepon: a.telepon,
          alamat_user: a.alamat_user,
          tanggal_lahir: a.tanggal_lahir,
        },
        createdAt: a.createdAt,
      };
    });

    return NextResponse.json({ bookings, meta: { count: bookings.length } });
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message ?? String(e) }, { status: 500 });
  }
}
