import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

type RegisterBody = {
  email?: string;
  nama?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  alamat?: string;
  password?: string;
  id_layanan?: string;
  id_tanggungan?: string;
};

export async function POST(req: Request) {
  try {
    const body: RegisterBody = await req.json();
    const email = (body.email || '').trim();
    const nama = (body.nama || '').trim();
    const no_telepon = (body.no_telepon || '').trim();
    const password = (body.password || '').trim();
    const jenis_kelamin = (body.jenis_kelamin || '').trim() || 'Pria';
    const tanggal_lahir = (body.tanggal_lahir || '').trim() || '1970-01-01';
    const alamat = (body.alamat || '').trim() || undefined;
    const id_layanan = body.id_layanan;
    const id_tanggungan = body.id_tanggungan;

    // Minimal requirement: no_telepon + password
    if (!no_telepon || !password) {
      return NextResponse.json({ message: 'no_telepon dan password wajib diisi' }, { status: 400 });
    }

    // Gunakan fallback nama/email bila tidak dikirim dari client mobile
    const resolvedNama = nama || `Pengguna ${no_telepon}`;
    const resolvedEmail = email || `${no_telepon}@user.local`;

    // Cek duplikasi berdasarkan email atau no_telepon
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: resolvedEmail }, { no_telepon }],
      },
    });

    if (existingUser) {
      const target = existingUser.no_telepon === no_telepon ? 'Nomor telepon' : 'Email';
      return NextResponse.json({ message: `${target} sudah terdaftar` }, { status: 400 });
    }

    // Enkripsi password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        email: resolvedEmail,
        nama: resolvedNama,
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
