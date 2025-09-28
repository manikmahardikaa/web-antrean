-- CreateTable
CREATE TABLE `User` (
    `id_user` CHAR(36) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `tanggal_lahir` DATE NOT NULL,
    `jenis_kelamin` VARCHAR(191) NOT NULL,
    `no_telepon` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `id_layanan` CHAR(36) NULL,
    `id_tanggungan` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_id_layanan_idx`(`id_layanan`),
    INDEX `User_id_tanggungan_idx`(`id_tanggungan`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Layanan` (
    `id_layanan` CHAR(36) NOT NULL,
    `nama_layanan` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `alasan_nonaktif` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Layanan_nama_layanan_idx`(`nama_layanan`),
    INDEX `Layanan_is_active_idx`(`is_active`),
    UNIQUE INDEX `Layanan_nama_layanan_key`(`nama_layanan`),
    PRIMARY KEY (`id_layanan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tanggungan` (
    `id_tanggungan` CHAR(36) NOT NULL,
    `nama_tanggungan` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `alasan_nonaktif` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Tanggungan_nama_tanggungan_idx`(`nama_tanggungan`),
    INDEX `Tanggungan_is_active_idx`(`is_active`),
    UNIQUE INDEX `Tanggungan_nama_tanggungan_key`(`nama_tanggungan`),
    PRIMARY KEY (`id_tanggungan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dokter` (
    `id_dokter` CHAR(36) NOT NULL,
    `nama_dokter` VARCHAR(191) NOT NULL,
    `spesialisasi` VARCHAR(191) NOT NULL,
    `foto_profil_dokter` LONGTEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `alasan_nonaktif` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Dokter_nama_dokter_idx`(`nama_dokter`),
    INDEX `Dokter_spesialisasi_idx`(`spesialisasi`),
    INDEX `Dokter_is_active_idx`(`is_active`),
    PRIMARY KEY (`id_dokter`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JadwalPraktik` (
    `id_jadwal` CHAR(36) NOT NULL,
    `id_dokter` CHAR(36) NOT NULL,
    `tanggal` DATE NOT NULL,
    `jam_mulai` DATETIME(3) NOT NULL,
    `jam_selesai` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JadwalPraktik_id_dokter_tanggal_idx`(`id_dokter`, `tanggal`),
    PRIMARY KEY (`id_jadwal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SlotPraktik` (
    `id_slot` CHAR(36) NOT NULL,
    `id_jadwal` CHAR(36) NOT NULL,
    `kapasitas` INTEGER NOT NULL DEFAULT 1,
    `terisi` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SlotPraktik_id_jadwal_idx`(`id_jadwal`),
    UNIQUE INDEX `SlotPraktik_id_jadwal_key`(`id_jadwal`),
    PRIMARY KEY (`id_slot`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Antrean` (
    `id_antrean` CHAR(36) NOT NULL,
    `id_user` CHAR(36) NOT NULL,
    `id_dokter` CHAR(36) NOT NULL,
    `id_layanan` CHAR(36) NOT NULL,
    `id_tanggungan` CHAR(36) NULL,
    `id_slot` CHAR(36) NOT NULL,
    `tanggal_lahir` DATE NOT NULL,
    `status` ENUM('MENUNGGU', 'DIPROSES', 'SELESAI', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU',
    `alamat_user` VARCHAR(191) NOT NULL,
    `dokter_nama_snapshot` VARCHAR(191) NULL,
    `alasan_batal` VARCHAR(191) NULL,
    `nama_pasien` VARCHAR(191) NOT NULL,
    `jenis_kelamin` VARCHAR(191) NOT NULL,
    `telepon` VARCHAR(191) NOT NULL,
    `no_antrean` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Antrean_id_slot_idx`(`id_slot`),
    INDEX `Antrean_id_user_idx`(`id_user`),
    INDEX `Antrean_id_dokter_idx`(`id_dokter`),
    INDEX `Antrean_id_layanan_idx`(`id_layanan`),
    INDEX `Antrean_id_tanggungan_idx`(`id_tanggungan`),
    INDEX `Antrean_tanggal_lahir_idx`(`tanggal_lahir`),
    INDEX `Antrean_status_tanggal_lahir_idx`(`status`, `tanggal_lahir`),
    INDEX `Antrean_id_slot_createdAt_idx`(`id_slot`, `createdAt`),
    UNIQUE INDEX `Antrean_id_slot_nama_pasien_tanggal_lahir_status_key`(`id_slot`, `nama_pasien`, `tanggal_lahir`, `status`),
    UNIQUE INDEX `Antrean_id_slot_no_antrean_key`(`id_slot`, `no_antrean`),
    PRIMARY KEY (`id_antrean`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BeritaKesehatan` (
    `id_berita` CHAR(36) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `tanggal_penerbitan` DATE NOT NULL,
    `foto_url` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BeritaKesehatan_tanggal_penerbitan_idx`(`tanggal_penerbitan`),
    PRIMARY KEY (`id_berita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoKesehatan` (
    `id_video` CHAR(36) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `tanggal_penerbitan` DATE NOT NULL,
    `video_url` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VideoKesehatan_tanggal_penerbitan_idx`(`tanggal_penerbitan`),
    PRIMARY KEY (`id_video`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_layanan_fkey` FOREIGN KEY (`id_layanan`) REFERENCES `Layanan`(`id_layanan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_tanggungan_fkey` FOREIGN KEY (`id_tanggungan`) REFERENCES `Tanggungan`(`id_tanggungan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JadwalPraktik` ADD CONSTRAINT `JadwalPraktik_id_dokter_fkey` FOREIGN KEY (`id_dokter`) REFERENCES `Dokter`(`id_dokter`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SlotPraktik` ADD CONSTRAINT `SlotPraktik_id_jadwal_fkey` FOREIGN KEY (`id_jadwal`) REFERENCES `JadwalPraktik`(`id_jadwal`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_dokter_fkey` FOREIGN KEY (`id_dokter`) REFERENCES `Dokter`(`id_dokter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_layanan_fkey` FOREIGN KEY (`id_layanan`) REFERENCES `Layanan`(`id_layanan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_tanggungan_fkey` FOREIGN KEY (`id_tanggungan`) REFERENCES `Tanggungan`(`id_tanggungan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_slot_fkey` FOREIGN KEY (`id_slot`) REFERENCES `SlotPraktik`(`id_slot`) ON DELETE RESTRICT ON UPDATE CASCADE;
