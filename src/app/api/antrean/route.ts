import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function bool(v: any) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['1', 'true', 't', 'ya', 'y'].includes(v.toLowerCase());
  return !!v;
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
      where.tanggal_kunjungan = {};
      if (dateFrom) where.tanggal_kunjungan.gte = new Date(dateFrom);
      if (dateTo) where.tanggal_kunjungan.lte = new Date(dateTo);
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
      orderBy: { tanggal_kunjungan: 'asc' },
      include: {
        user: { select: { id_user: true, nama: true, no_telepon: true } },
        dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } },
        layanan: { select: { id_layanan: true, nama_layanan: true } },
      },
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id_user, id_dokter, id_layanan, id_tanggungan, id_slot, alamat_user } = body ?? {};

    if (!id_user || !id_dokter || !id_layanan || !id_slot || !alamat_user) {
      return NextResponse.json({ message: 'id_user, id_dokter, id_layanan, id_slot, dan alamat_user wajib diisi' }, { status: 400 });
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
        tanggal_kunjungan: new Date(jamMulai),
        alamat_user,
        dokter_nama_snapshot,
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    // Unique constraint (double book)
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Antrean duplikat untuk user pada slot/waktu tersebut' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
