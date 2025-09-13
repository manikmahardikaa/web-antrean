import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password }: { email: string; password: string } = body;

    // Validasi input dasar
    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi' }, { status: 400 });
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Bandingkan password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ message: 'Password salah' }, { status: 401 });
    }

    // Buat token JWT
    const token = generateToken({
      id_user: user.id_user,
      email: user.email,
      role: user.role,
    });
    const expiresIn = 60 * 60 * 24; // 24 jam dalam detik

    // Jangan kirim password ke client
    const { password: _pw, ...safeUser } = user;

    return NextResponse.json(
      {
        message: 'Login berhasil',
        token,
        expiresIn,
        // user: safeUser,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'Terjadi kesalahan saat login',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
