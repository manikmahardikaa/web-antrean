import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRole } from '@/lib/middleware/withRole';
import jwt from 'jsonwebtoken';
void jwt;

export const runtime = 'nodejs';

/* ================== Helpers aman timezone ================== */
function parseDateOnlyUTC(input: any): Date | null {
  if (!input) return null;
  if (typeof input === 'string') {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(input);
  if (isNaN(d.valueOf())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); // UTC 00:00
}

function parseTimeToUTCDate(input: any): Date | null {
  if (!input) return null;
  if (typeof input === 'string') {
    const m = input.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      const h = +m[1],
        mi = +m[2],
        s = m[3] ? +m[3] : 0;
      if (h >= 0 && h < 24 && mi >= 0 && mi < 60 && s >= 0 && s < 60) {
        return new Date(Date.UTC(1970, 0, 1, h, mi, s));
      }
    }
  }
  const d = new Date(input);
  if (isNaN(d.valueOf())) return null;
  return new Date(Date.UTC(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
}

// Jika kolom jam_* adalah STRING @db.Time, sediakan formatter ini:
// function formatTimeHHmmss(d: Date): string {
//   const pad = (n: number) => String(n).padStart(2, '0');
//   return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
// }

/* ================== GET list jadwal ==================
   Query:
   - ?q=...                (nama dokter / spesialisasi)
   - ?id_dokter=...
   - ?tanggal=YYYY-MM-DD   (tepat hari tsb)
   - ?from=YYYY-MM-DD&to=YYYY-MM-DD  (inklusif)
*/
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const id_dokter = (searchParams.get('id_dokter') || '').trim();
    const tanggal = (searchParams.get('tanggal') || '').trim();
    const from = (searchParams.get('from') || '').trim();
    const to = (searchParams.get('to') || '').trim();

    const where: any = {};

    if (id_dokter) where.id_dokter = id_dokter;

    // Filter tanggal aman untuk kolom @db.Date
    if (tanggal) {
      const day = parseDateOnlyUTC(tanggal);
      if (day) {
        // Karena kolom @db.Date tidak menyimpan waktu, cukup equals
        where.tanggal = { equals: day };
      }
    } else if (from || to) {
      const f = from ? parseDateOnlyUTC(from) : null;
      const t = to ? parseDateOnlyUTC(to) : null;
      where.tanggal = {
        ...(f ? { gte: f } : {}),
        ...(t ? { lte: t } : {}),
      };
    }

    if (q) {
      // Untuk relasi 1-1/optional gunakan is: { ... }
      // Tambahkan mode: 'insensitive' jika DB/Prisma Anda mendukung (Postgres/SQLite, MySQL tergantung versi & collation).
      where.dokter = {
        is: {
          OR: [{ nama_dokter: { contains: q /* , mode: 'insensitive' */ } }, { spesialisasi: { contains: q /* , mode: 'insensitive' */ } }],
        },
      };
    }

    const rows = await prisma.jadwalPraktik.findMany({
      where,
      orderBy: [{ tanggal: 'asc' }, { jam_mulai: 'asc' }],
      include: {
        dokter: { select: { id_dokter: true, nama_dokter: true, spesialisasi: true } },
      },
    });

    const data = rows.map((r) => ({
      ...r,
      nama_dokter: r.dokter?.nama_dokter,
      spesialisasi: r.dokter?.spesialisasi,
    }));

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
}

/* ================== POST create ==================
   Body { id_dokter, tanggal, jam_mulai, jam_selesai }
   - tanggal bisa 'YYYY-MM-DD' / Date / ISO → difix ke UTC 00:00
   - jam_* bisa 'HH:mm' / 'HH:mm:ss' / Date / ISO → dinormalisasi ke 1970-01-01 UTC
*/
export const POST = withRole('ADMIN')(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const id_dokter = (body?.id_dokter || '').toString().trim();

    const tanggal = parseDateOnlyUTC(body?.tanggal);
    const jam_mulai = parseTimeToUTCDate(body?.jam_mulai);
    const jam_selesai = parseTimeToUTCDate(body?.jam_selesai);

    if (!id_dokter) {
      return NextResponse.json({ message: 'id_dokter wajib' }, { status: 400 });
    }
    if (!tanggal || !jam_mulai || !jam_selesai) {
      return NextResponse.json({ message: 'tanggal/jam tidak valid' }, { status: 400 });
    }
    if (jam_selesai <= jam_mulai) {
      return NextResponse.json({ message: 'jam_selesai harus > jam_mulai' }, { status: 400 });
    }

    // Jika kolom jam_* adalah STRING @db.Time, gunakan formatter:
    // const created = await prisma.jadwalPraktik.create({
    //   data: {
    //     id_dokter,
    //     tanggal, // @db.Date
    //     jam_mulai: formatTimeHHmmss(jam_mulai),
    //     jam_selesai: formatTimeHHmmss(jam_selesai),
    //   },
    // });

    const created = await prisma.jadwalPraktik.create({
      data: { id_dokter, tanggal, jam_mulai, jam_selesai },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2003') return NextResponse.json({ message: 'id_dokter tidak valid' }, { status: 400 });
    return NextResponse.json({ message: 'Internal error', error: e?.message }, { status: 500 });
  }
});
