import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function mapAntreanRow(row: any) {
  const { slot, ...rest } = row;
  const jamMulai = slot?.jadwal?.jam_mulai ?? null;
  const tanggalKunjungan = jamMulai ? new Date(jamMulai).toISOString() : new Date(rest.createdAt).toISOString();
  return {
    ...rest,
    tanggal_kunjungan: tanggalKunjungan,
    slot,
  };
}

function bool(v: any) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['1', 'true', 't', 'ya', 'y'].includes(v.toLowerCase());
  return !!v;
}

function parseDateOnlyUTC(s: any) {
  if (!s) return null;
  if (typeof s === 'string') {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(s);
  if (Number.isNaN(d.valueOf())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const status = (searchParams.get('status') || '').trim().toUpperCase(); // MENUNGGU | DIPROSES | SELESAI | DIBATALKAN
    const id_dokter = (searchParams.get('id_dokter') || '').trim();
    const id_layanan = (searchParams.get('id_layanan') || '').trim();
    const id_user = (searchParams.get('id_user') || '').trim();
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    const where: any = {};


    if (status && ['MENUNGGU', 'DIPROSES', 'SELESAI', 'DIBATALKAN'].includes(status)) where.status = status;
    if (id_dokter) where.id_dokter = id_dokter;
    if (id_layanan) where.id_layanan = id_layanan;
    if (id_user) where.id_user = id_user;

    if (dateFrom || dateTo) {
      where.slot = where.slot || {};
      where.slot.jadwal = where.slot.jadwal || {};
      where.slot.jadwal.jam_mulai = where.slot.jadwal.jam_mulai || {};
      if (dateFrom) where.slot.jadwal.jam_mulai.gte = new Date(dateFrom);
      if (dateTo) where.slot.jadwal.jam_mulai.lte = new Date(dateTo);
    }

    // pencarian sederhana di user/dokter/layanan/alamat
    if (q) {
      where.OR = [
        { alamat_user: { contains: q, mode: 'insensitive' } },
        { dokter_nama_snapshot: { contains: q, mode: 'insensitive' } },
        { user: { nama: { contains: q, mode: 'insensitive' } } as any },
        { dokter: { nama_dokter: { contains: q, mode: 'insensitive' } } as any },
        { layanan: { nama_layanan: { contains: q, mode: 'insensitive' } } as any },
      ];
    }

    const rows = await prisma.antrean.findMany({
      where,
      orderBy: [{ slot: { jadwal: { jam_mulai: 'asc' } } }, { createdAt: 'asc' }],
      include: {
        user: { select: { id_user: true, nama: true, no_telepon: true } },
        dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } },
        layanan: { select: { id_layanan: true, nama_layanan: true } },
        tanggungan: { select: { id_tanggungan: true, nama_tanggungan: true } },
        slot: {
          select: {
            id_slot: true,
            jadwal: { select: { jam_mulai: true } },
          },
        },
      },
    });

    return NextResponse.json(rows.map(mapAntreanRow));
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id_user,
      id_dokter,
      id_layanan,
      id_tanggungan,
      id_slot,
      alamat_user,
      tanggal_lahir,
      nama_pasien,
      jenis_kelamin,
      telepon,
    } = body ?? {};

    const namaPasien = String(nama_pasien || '').trim();
    const jenisKelamin = String(jenis_kelamin || '').trim();
    const teleponTrim = String(telepon || '').trim();
    const alamatTrim = String(alamat_user || '').trim();
    const dob = parseDateOnlyUTC(tanggal_lahir);

    if (!id_user || !id_dokter || !id_layanan || !id_slot) {
      return NextResponse.json({ message: 'id_user, id_dokter, id_layanan, dan id_slot wajib diisi' }, { status: 400 });
    }
    if (!alamatTrim) {
      return NextResponse.json({ message: 'alamat_user wajib diisi' }, { status: 400 });
    }
    if (!dob) {
      return NextResponse.json({ message: 'tanggal_lahir wajib diisi (format YYYY-MM-DD)' }, { status: 400 });
    }
    if (!namaPasien) {
      return NextResponse.json({ message: 'nama_pasien wajib diisi' }, { status: 400 });
    }
    if (!jenisKelamin) {
      return NextResponse.json({ message: 'jenis_kelamin wajib diisi' }, { status: 400 });
    }
    if (!teleponTrim) {
      return NextResponse.json({ message: 'telepon wajib diisi' }, { status: 400 });
    }

    // Ambil slot + kapasitas + waktu (fallback lewat relasi jadwal bila kolom jam_mulai di slot tidak ada)
    const slot = await prisma.slotPraktik.findUnique({
      where: { id_slot },
      include: { jadwal: { select: { jam_mulai: true } } },
    });
    if (!slot) return NextResponse.json({ message: 'Slot tidak ditemukan' }, { status: 404 });
    if (bool(slot.is_active) === false) return NextResponse.json({ message: 'Slot nonaktif' }, { status: 400 });

    const jamMulai = (slot as any).jam_mulai ?? slot.jadwal?.jam_mulai;
    if (!jamMulai) return NextResponse.json({ message: 'Slot tidak memiliki jam_mulai' }, { status: 400 });

    // Kapasitas: hitung antrean non-cancel (MENUNGGU/DIPROSES/SELESAI → dianggap penuhi kuota)
    const terisi = await prisma.antrean.count({
      where: { id_slot, status: { not: 'DIBATALKAN' } },
    });
    if (terisi >= slot.kapasitas) return NextResponse.json({ message: 'Slot penuh' }, { status: 400 });

    const { _max } = await prisma.antrean.aggregate({
      where: { id_slot },
      _max: { no_antrean: true },
    });
    const no_antrean = (_max.no_antrean ?? 0) + 1;

    // Snapshot nama dokter
    const d = await prisma.dokter.findUnique({ where: { id_dokter }, select: { nama_dokter: true } });
    const dokter_nama_snapshot = d?.nama_dokter || null;

    // Buat antrean
    const row = await prisma.antrean.create({
      data: {
        id_user,
        id_dokter,
        id_layanan,
        id_tanggungan: id_tanggungan || null,
        id_slot,
        tanggal_lahir: dob,
        alamat_user: alamatTrim,
        nama_pasien: namaPasien,
        jenis_kelamin: jenisKelamin,
        telepon: teleponTrim,
        no_antrean,
        dokter_nama_snapshot,
      },
      include: {
        user: { select: { id_user: true, nama: true, no_telepon: true } },
        dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } },
        layanan: { select: { id_layanan: true, nama_layanan: true } },
        tanggungan: { select: { id_tanggungan: true, nama_tanggungan: true } },
        slot: {
          select: {
            id_slot: true,
            jadwal: { select: { jam_mulai: true } },
          },
        },
      },
    });

    return NextResponse.json(mapAntreanRow(row), { status: 201 });
  } catch (e: any) {
    // Unique constraint (double book)
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Antrean duplikat untuk user pada slot/waktu tersebut' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
