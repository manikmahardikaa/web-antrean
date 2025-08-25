import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/withAuth';

const includeUser = {
  layanan: { select: { id_layanan: true, nama_layanan: true } },
  tanggungan: { select: { id_tanggungan: true, nama_tanggungan: true } },
};

export const GET = withAuth(async (req, _ctx, user) => {
  // List pengguna — ADMIN only
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden: Access denied' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const q = (searchParams.get('q') || '').trim();
  const role = (searchParams.get('role') || '').trim().toUpperCase(); // USER | ADMIN
  const jk = (searchParams.get('jk') || '').trim().toUpperCase(); // L | P
  const layanan = (searchParams.get('layanan') || '').trim();
  const tanggungan = (searchParams.get('tanggungan') || '').trim();

  const where: any = {};
  if (q) {
    where.OR = [{ nama: { contains: q } }, { email: { contains: q } }, { no_telepon: { contains: q } }, { alamat: { contains: q } }];
  }
  if (role === 'USER' || role === 'ADMIN') where.role = role;
  if (jk === 'Pria' || jk === 'Wanita') where.jenis_kelamin = { startsWith: jk };
  if (layanan) where.id_layanan = layanan;
  if (tanggungan) where.id_tanggungan = tanggungan;

  const rows = await prisma.user.findMany({
    where,
    include: includeUser,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(rows);
});

export const POST = withAuth(async (req, _ctx, user) => {
  // Create — ADMIN only
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden: Access denied' }, { status: 403 });
  }

  try {
    const body = await req.json();

    const {
      nama,
      email,
      password,
      tanggal_lahir,
      jenis_kelamin,
      no_telepon,
      alamat = null,
      role = 'USER', // admin boleh set
      id_layanan = null,
      id_tanggungan = null,
    } = body || {};

    if (!nama || !email || !password || !tanggal_lahir || !jenis_kelamin || !no_telepon) {
      return NextResponse.json({ message: 'Field wajib tidak lengkap' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    const created = await prisma.user.create({
      data: {
        nama: String(nama).trim(),
        email: String(email).toLowerCase().trim(),
        password: hashed,
        tanggal_lahir: new Date(tanggal_lahir),
        jenis_kelamin: String(jenis_kelamin),
        no_telepon: String(no_telepon),
        alamat: alamat ? String(alamat) : null,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        id_layanan: id_layanan || null,
        id_tanggungan: id_tanggungan || null,
      },
      include: includeUser,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Unique email conflict
    if (e?.code === 'P2002') {
      return NextResponse.json({ message: 'Email sudah digunakan' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
