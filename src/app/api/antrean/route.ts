import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRole } from "@/lib/middleware/withRole";

function toBool(v: any) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string")
    return ["1", "true", "t", "ya", "y"].includes(v.toLowerCase());
  return !!v;
}

/* ============================ GET (ADMIN) ============================ */
export const GET = withRole("ADMIN")(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "").trim().toUpperCase(); // MENUNGGU | DIPROSES | SELESAI | DIBATALKAN
    const id_dokter = (searchParams.get("id_dokter") || "").trim();
    const id_layanan = (searchParams.get("id_layanan") || "").trim();
    const id_user = (searchParams.get("id_user") || "").trim();
    const dateFrom = searchParams.get("from"); // ISO
    const dateTo = searchParams.get("to"); // ISO

    const where: any = {};

    if (
      status &&
      ["MENUNGGU", "DIPROSES", "SELESAI", "DIBATALKAN"].includes(status)
    )
      where.status = status;
    if (id_dokter) where.id_dokter = id_dokter;
    if (id_layanan) where.id_layanan = id_layanan;
    if (id_user) where.id_user = id_user;

    // Filter tanggal via relasi Slot -> Jadwal (pakai jam_mulai supaya inklusif waktu)
    if (dateFrom || dateTo) {
      where.slot = {
        is: {
          jadwal: {
            ...(dateFrom ? { jam_mulai: { gte: new Date(dateFrom) } } : {}),
            ...(dateTo ? { jam_mulai: { lte: new Date(dateTo) } } : {}),
          },
        },
      };
    }

    // Pencarian bebas (snapshot + relasi)
    if (q) {
      where.OR = [
        { alamat_user: { contains: q, mode: "insensitive" } },
        { dokter_nama_snapshot: { contains: q, mode: "insensitive" } },
        { nama_pasien: { contains: q, mode: "insensitive" } },
        { telepon: { contains: q, mode: "insensitive" } },
        { user: { is: { nama: { contains: q, mode: "insensitive" } } } },
        {
          dokter: { is: { nama_dokter: { contains: q, mode: "insensitive" } } },
        },
        {
          layanan: {
            is: { nama_layanan: { contains: q, mode: "insensitive" } },
          },
        },
      ];
    }

    const rows = await prisma.antrean.findMany({
      where,
      orderBy: { slot: { jadwal: { jam_mulai: "asc" } } },
      include: {
        user: { select: { id_user: true, nama: true, no_telepon: true } },
        dokter: {
          select: { id_dokter: true, nama_dokter: true, spesialisasi: true },
        },
        layanan: { select: { id_layanan: true, nama_layanan: true } },
        slot: {
          select: {
            id_slot: true,
            kapasitas: true,
            terisi: true,
            jadwal: {
              select: { tanggal: true, jam_mulai: true, jam_selesai: true },
            },
          },
        },
      },
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json(
      { message: "Internal error", error: e?.message },
      { status: 500 }
    );
  }
});

/* ============================ POST (USER login) ============================ */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  try {
    const body = await req.json();
    const {
      id_user = user?.id_user, // default: dari token
      id_dokter,
      id_layanan,
      id_tanggungan,
      id_slot,
      alamat_user,
      // Wajib sesuai schema:
      nama_pasien,
      jenis_kelamin,
      telepon,
      tanggal_lahir, // ISO date
    } = body ?? {};

    // Validasi presence
    const missing = [
      ["id_user", id_user],
      ["id_dokter", id_dokter],
      ["id_layanan", id_layanan],
      ["id_slot", id_slot],
      ["alamat_user", alamat_user],
      ["nama_pasien", nama_pasien],
      ["jenis_kelamin", jenis_kelamin],
      ["telepon", telepon],
      ["tanggal_lahir", tanggal_lahir],
    ]
      .filter(([_, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      return NextResponse.json(
        { message: `Field wajib: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Ambil slot + jadwal
    const slot = await prisma.slotPraktik.findUnique({
      where: { id_slot },
      include: { jadwal: { select: { jam_mulai: true } } },
    });
    if (!slot)
      return NextResponse.json(
        { message: "Slot tidak ditemukan" },
        { status: 404 }
      );
    if (toBool(slot.is_active) === false)
      return NextResponse.json({ message: "Slot nonaktif" }, { status: 400 });

    const jamMulai = slot.jadwal?.jam_mulai;
    if (!jamMulai)
      return NextResponse.json(
        { message: "Slot tidak memiliki jam_mulai" },
        { status: 400 }
      );

    // Snapshot nama dokter
    const d = await prisma.dokter.findUnique({
      where: { id_dokter },
      select: { nama_dokter: true },
    });
    const dokter_nama_snapshot = d?.nama_dokter || null;

    // Transaksi: cek kapasitas → tentukan nomor → create antrean → update slot.terisi
    const created = await prisma.$transaction(async (tx) => {
      const terpakai = await tx.antrean.count({
        where: { id_slot, status: { not: "DIBATALKAN" } },
      });
      if (terpakai >= slot.kapasitas) {
        throw new Error("SLOT_PENUH");
      }

      // nomor urut: total antrean (apa pun status) + 1 → dijamin unik via constraint
      const nextNo = (await tx.antrean.count({ where: { id_slot } })) + 1;

      const row = await tx.antrean.create({
        data: {
          id_user,
          id_dokter,
          id_layanan,
          id_tanggungan: id_tanggungan || null,
          id_slot,
          alamat_user,
          dokter_nama_snapshot,
          // snapshot pasien:
          nama_pasien,
          jenis_kelamin,
          telepon,
          tanggal_lahir: new Date(tanggal_lahir),
          no_antrean: nextNo,
          // NB: tanpa kolom tanggal_kunjungan — waktu diambil via relasi slot.jadwal
        },
      });

      // Naikkan counter terisi (opsional, untuk display cepat)
      await tx.slotPraktik.update({
        where: { id_slot },
        data: { terisi: { increment: 1 } },
      });

      return row;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.message === "SLOT_PENUH") {
      return NextResponse.json({ message: "Slot penuh" }, { status: 400 });
    }
    // Unique constraint (double book)
    if (e?.code === "P2002") {
      return NextResponse.json(
        { message: "Antrean duplikat untuk pasien pada slot tersebut" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal error", error: e?.message },
      { status: 500 }
    );
  }
});
