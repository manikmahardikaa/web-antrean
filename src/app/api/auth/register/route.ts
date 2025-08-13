import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      nama,
      tanggal_lahir,
      jenis_kelamin,
      no_telepon,
      alamat,
      password,
      id_layanan,
      id_tanggungan,
    }: {
      email: string;
      nama: string;
      tanggal_lahir: string;
      jenis_kelamin: string;
      no_telepon: string;
      alamat?: string;
      password: string;
      id_layanan?: string;
      id_tanggungan?: string;
    } = body;

    // Validasi input wajib
    if (!email || !nama || !tanggal_lahir || !jenis_kelamin || !no_telepon || !password) {
      return NextResponse.json(
        {
          message: 'Semua field wajib diisi: email, nama, tanggal_lahir, jenis_kelamin, no_telepon, password',
        },
        { status: 400 }
      );
    }

    // Cek jika email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Enkripsi password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        email,
        nama,
        tanggal_lahir: new Date(tanggal_lahir),
        jenis_kelamin,
        no_telepon,
        alamat,
        password: hashedPassword,
        id_layanan,
        id_tanggungan,
      },
    });

    // Jangan kirim password ke response
    const { password: _pw, ...safeUser } = newUser;

    return NextResponse.json({ message: 'Registrasi berhasil', user: safeUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'Terjadi kesalahan saat registrasi',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
