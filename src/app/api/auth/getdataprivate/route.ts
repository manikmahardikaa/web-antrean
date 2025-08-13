import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;

    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      if (err instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ message: 'Token sudah kedaluwarsa' }, { status: 401 });
      }

      if (err instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ message: 'Token tidak valid' }, { status: 401 });
      }

      return NextResponse.json({ message: 'Gagal memverifikasi token', error: err.message }, { status: 500 });
    }

    if (!decoded || !decoded.id_user) {
      return NextResponse.json({ message: 'Payload token tidak sesuai' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id_user: decoded.id_user },
      select: {
        id_user: true,
        nama: true,
        email: true,
        role: true,
        tanggal_lahir: true,
        jenis_kelamin: true,
        no_telepon: true,
        alamat: true,
        createdAt: true,
        updatedAt: true,
        layanan: {
          select: {
            id_layanan: true,
            nama_layanan: true,
          },
        },
        tanggungan: {
          select: {
            id_tanggungan: true,
            nama_tanggungan: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data user berhasil diambil', user });
  } catch (error: any) {
    return NextResponse.json({ message: 'Terjadi kesalahan tak terduga', error: error.message }, { status: 500 });
  }
}
