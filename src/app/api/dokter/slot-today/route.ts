// app/api/dokter/slots-today/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

function dateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: Request) {
  try {
    // ===== Auth: wajib Bearer token =====
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Akan throw jika token invalid/expired
    const user = await verifyToken(token);
    // (opsional) cek role jika perlu: if (!['ADMIN','USER'].includes(user.role)) ...

    // ===== Query params =====
    const { searchParams } = new URL(req.url);
    const dateStr = (searchParams.get('date') || '').trim(); // YYYY-MM-DD (opsional)
    const id_dokter = (searchParams.get('id_dokter') || '').trim(); // filter per dokter (opsional)
    const status = (searchParams.get('status') || 'active').toLowerCase(); // 'active' | 'all'

    // Tanggal target (UTC 00:00)
    let targetDate: Date;
    if (dateStr) {
      const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return NextResponse.json({ message: 'Format date harus YYYY-MM-DD' }, { status: 400 });
      targetDate = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    } else {
      targetDate = dateOnlyUTC(new Date());
    }

    // ===== Query slot hari itu =====
    const slotWhere: any = {
      ...(status === 'active' ? { is_active: true } : {}),
      jadwal: {
        tanggal: targetDate,
        ...(id_dokter ? { dokter: { id_dokter } } : {}),
      },
    };

    const slots = await prisma.slotPraktik.findMany({
      where: slotWhere,
      include: {
        jadwal: {
          include: {
            dokter: {
              select: {
                id_dokter: true,
                nama_dokter: true,
                spesialisasi: true,
                foto_profil_dokter: true,
                is_active: true,
                deletedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    type Agg = Record<
      string,
      {
        id_dokter: string;
        nama_dokter: string;
        spesialisasi: string;
        foto_profil_dokter: string | null;
        is_active: boolean;
        total_slot: number;
        total_kapasitas: number;
        total_terisi: number;
        total_sisa: number;
      }
    >;

    const agg: Agg = {};
    for (const s of slots) {
      const d = s.jadwal.dokter;
      if (!agg[d.id_dokter]) {
        agg[d.id_dokter] = {
          id_dokter: d.id_dokter,
          nama_dokter: d.nama_dokter,
          spesialisasi: d.spesialisasi,
          foto_profil_dokter: d.foto_profil_dokter ?? null,
          is_active: d.is_active && !d.deletedAt,
          total_slot: 0,
          total_kapasitas: 0,
          total_terisi: 0,
          total_sisa: 0,
        };
      }
      agg[d.id_dokter].total_slot += 1;
      agg[d.id_dokter].total_kapasitas += s.kapasitas;
      agg[d.id_dokter].total_terisi += s.terisi;
      agg[d.id_dokter].total_sisa += Math.max(0, s.kapasitas - s.terisi);
    }

    const result = Object.values(agg).sort((a, b) => a.nama_dokter.localeCompare(b.nama_dokter));
    return NextResponse.json(result);
  } catch (e: any) {
    // verifyToken melempar error => 401
    if (e?.name === 'TokenExpiredError' || e?.name === 'JsonWebTokenError' || e?.message?.toLowerCase?.().includes('jwt')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}
