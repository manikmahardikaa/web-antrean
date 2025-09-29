import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import { StatusAntrean } from '@prisma/client';

// Helper: parse YYYY-MM-DD jadi Date UTC (aman untuk kolom DATE prisma)
function parseYMD(ymd: string | null): Date | null {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d));
}

// Helper: tanggal “hari ini” di zona Asia/Makassar → Date UTC (untuk kolom DATE)
function todayMakassarAsUTCDate(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const makassar = new Date(utcMs + 8 * 60 * 60000); // UTC+8
  const y = makassar.getUTCFullYear();
  const m = makassar.getUTCMonth();
  const d = makassar.getUTCDate();
  return new Date(Date.UTC(y, m, d));
}

// Helper: format waktu HH:mm dari Date
function hhmm(d: Date) {
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export const GET = withRole('ADMIN')(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const start = parseYMD(searchParams.get('start')); // YYYY-MM-DD (opsional)
  const end = parseYMD(searchParams.get('end')); // YYYY-MM-DD (opsional)
  const layananId = searchParams.get('layananId') || undefined;

  // Range default: 7 hari terakhir (termasuk hari ini)
  const endDefault = todayMakassarAsUTCDate();
  const startDefault = new Date(endDefault);
  startDefault.setUTCDate(endDefault.getUTCDate() - 6);

  const rangeGte = start ?? startDefault;
  const rangeLte = end ?? endDefault;

  // ===== SUMMARY (hari ini) =====
  const today = todayMakassarAsUTCDate();

  const [totalUser, totalDokter, antreanHariIni, dibatalkanHariIni] = await Promise.all([
    prisma.user.count(),
    prisma.dokter.count({ where: { is_active: true } }),
    prisma.antrean.count({
      where: {
        ...(layananId ? { id_layanan: layananId } : {}),
        status: { in: [StatusAntrean.MENUNGGU, StatusAntrean.DIPROSES, StatusAntrean.SELESAI] },
        slot: { jadwal: { tanggal: today } },
      },
    }),
    prisma.antrean.count({
      where: {
        ...(layananId ? { id_layanan: layananId } : {}),
        status: StatusAntrean.DIBATALKAN,
        slot: { jadwal: { tanggal: today } },
      },
    }),
  ]);

  // ===== TABEL: Antrean terbaru (sesuai kolom tabel di UI) =====
  const recentAntreanRaw = await prisma.antrean.findMany({
    where: {
      ...(layananId ? { id_layanan: layananId } : {}),
      slot: { jadwal: { tanggal: { gte: rangeGte, lte: rangeLte } } },
    },
    include: {
      dokter: true,
      layanan: true,
      slot: { include: { jadwal: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const recentAntrean = recentAntreanRaw.map((a) => ({
    key: a.id_antrean,
    pasien: a.nama_pasien,
    dokter: a.dokter_nama_snapshot ?? a.dokter?.nama_dokter ?? '-',
    layanan: a.layanan?.nama_layanan ?? '-',
    // kirim ISO lengkap; biar UI bebas format. Bisa juga kirim "YYYY-MM-DD HH:mm"
    tanggal: a.slot?.jadwal?.jam_mulai?.toISOString() ?? '',
    status: a.status,
    alamat_user: a.alamat_user,
  }));

  const grp = await prisma.antrean.groupBy({
    by: ['id_layanan'],
    where: {
      ...(layananId ? { id_layanan: layananId } : {}),
      slot: { jadwal: { tanggal: { gte: rangeGte, lte: rangeLte } } },
    },
    // Hitung kolom yang pasti non-null (primary key) → aman untuk urutkan
    _count: { id_antrean: true },
    orderBy: { _count: { id_antrean: 'desc' } },
  });

  // Filter id_layanan yang bukan null untuk query nama layanan
  const layananIds = grp.map((g) => g.id_layanan).filter((v): v is string => typeof v === 'string' && v.length > 0);

  const layananMap = new Map(
    (
      await prisma.layanan.findMany({
        where: { id_layanan: { in: layananIds } },
        select: { id_layanan: true, nama_layanan: true },
      })
    ).map((l) => [l.id_layanan, l.nama_layanan])
  );

  const topLayanan = grp.map((g) => ({
    id_layanan: g.id_layanan,
    nama: g.id_layanan ? layananMap.get(g.id_layanan) ?? '(Tidak diketahui)' : '(Tidak diketahui)',
    total: g._count?.id_antrean ?? 0, // akses aman untuk _count
  }));

  // ===== JADWAL TERDEKAT (hari ini; status MENUNGGU/DIPROSES) =====
  const upcomingRaw = await prisma.antrean.findMany({
    where: {
      ...(layananId ? { id_layanan: layananId } : {}),
      status: { in: [StatusAntrean.MENUNGGU, StatusAntrean.DIPROSES] },
      slot: { jadwal: { tanggal: today } },
    },
    include: {
      dokter: true,
      layanan: true,
      slot: { include: { jadwal: true } },
    },
    orderBy: [{ slot: { jadwal: { jam_mulai: 'asc' } } }, { no_antrean: 'asc' }, { createdAt: 'asc' }],
    take: 20,
  });

  const upcomingJadwal = upcomingRaw.map((a) => ({
    waktu: a.slot?.jadwal?.jam_mulai ? hhmm(a.slot.jadwal.jam_mulai) : '',
    dokter: a.dokter?.nama_dokter ?? '(Tanpa dokter)',
    layanan: a.layanan?.nama_layanan ?? '(Tanpa layanan)',
  }));

  // ===== TREN 7 HARI (total & dibatalkan per tanggal) =====
  const trenSrc = await prisma.antrean.findMany({
    where: {
      ...(layananId ? { id_layanan: layananId } : {}),
      slot: { jadwal: { tanggal: { gte: startDefault, lte: endDefault } } },
    },
    select: {
      status: true,
      slot: { select: { jadwal: { select: { tanggal: true } } } },
    },
  });

  const pad = (n: number) => n.toString().padStart(2, '0');
  function ymd(d: Date) {
    // d pada prisma DATE adalah UTC midnight
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(endDefault);
    d.setUTCDate(endDefault.getUTCDate() - (6 - i));
    days.push(ymd(d));
  }

  const agg = new Map(days.map((k) => [k, { tanggal: k, total: 0, dibatalkan: 0 }]));
  for (const r of trenSrc) {
    const key = ymd(r.slot!.jadwal!.tanggal);
    const row = agg.get(key);
    if (!row) continue;
    if (r.status === StatusAntrean.DIBATALKAN) row.dibatalkan += 1;
    else row.total += 1;
  }
  const tren7Hari = days.map((k) => agg.get(k)!);

  return NextResponse.json({
    summary: {
      totalUser,
      totalDokter,
      antreanHariIni,
      dibatalkanHariIni,
    },
    recentAntrean,
    topLayanan,
    upcomingJadwal,
    tren7Hari,
  });
});
