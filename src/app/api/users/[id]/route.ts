import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/withAuth';

const includeUser = {
  layanan: { select: { id_layanan: true, nama_layanan: true } },
  tanggungan: { select: { id_tanggungan: true, nama_tanggungan: true } },
};

export const GET = withAuth(async (_req, ctx, user) => {
  const id = ctx?.params?.id as string;
  if (!id) return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });

  // ADMIN boleh lihat siapa pun; USER hanya boleh lihat dirinya sendiri
  if (!user || (user.role !== 'ADMIN' && user.id_user !== id)) {
    return NextResponse.json({ message: 'Forbidden: Access denied' }, { status: 403 });
  }

  const row = await prisma.user.findUnique({
    where: { id_user: id },
    include: includeUser,
  });

  if (user.role !== 'ADMIN') {
    const { password, role, ...safe } = row as any;
    return NextResponse.json(safe);
  }

  if (!row) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
  return NextResponse.json(row);
});

export const PUT = withAuth(async (req, ctx, user) => {
  const id = ctx?.params?.id as string;
  if (!id) return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });

  // ADMIN boleh update siapa pun; USER hanya boleh update dirinya sendiri
  if (!user || (user.role !== 'ADMIN' && user.id_user !== id)) {
    return NextResponse.json({ message: 'Forbidden: Access denied' }, { status: 403 });
  }

  try {
    const body = await req.json();

    const isAdmin = user.role === 'ADMIN';

    const {
      nama,
      email,
      password,
      tanggal_lahir,
      jenis_kelamin,
      no_telepon,
      alamat,
      role, // USER tidak boleh mengubah; diabaikan jika bukan ADMIN
      id_layanan,
      id_tanggungan,
    } = body || {};

    const data: any = {};

    if (nama !== undefined) data.nama = String(nama).trim();
    if (email !== undefined) data.email = String(email).toLowerCase().trim();
    if (tanggal_lahir !== undefined) data.tanggal_lahir = new Date(tanggal_lahir);
    if (jenis_kelamin !== undefined) data.jenis_kelamin = String(jenis_kelamin);
    if (no_telepon !== undefined) data.no_telepon = String(no_telepon);
    if (alamat !== undefined) data.alamat = alamat ? String(alamat) : null;
    if (id_layanan !== undefined) data.id_layanan = id_layanan || null;
    if (id_tanggungan !== undefined) data.id_tanggungan = id_tanggungan || null;

    if (password) {
      data.password = await bcrypt.hash(String(password), 10);
    }

    if (isAdmin) {
      if (role !== undefined) {
        data.role = role === 'ADMIN' ? 'ADMIN' : 'USER';
      }
    } // else: USER -> abaikan field role

    const updated = await prisma.user.update({
      where: { id_user: id },
      data,
      include: includeUser,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      // unique email
      return NextResponse.json({ message: 'Email sudah digunakan' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});

export const DELETE = withAuth(async (_req, ctx, user) => {
  const id = ctx?.params?.id as string;
  if (!id) return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });

  // Hanya ADMIN
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden: Access denied' }, { status: 403 });
  }

  try {
    const deleted = await prisma.user.delete({
      where: { id_user: id },
      include: includeUser,
    });
    return NextResponse.json({ ok: true, deleted });
  } catch (e: any) {
    // Foreign key restriction (misal masih punya antrean)
    if (e?.code === 'P2003') {
      return NextResponse.json({ message: 'Tidak dapat menghapus: data terkait masih ada (mis. antrean).' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
