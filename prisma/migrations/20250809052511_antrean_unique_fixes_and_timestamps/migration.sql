/*
  Warnings:

  - A unique constraint covering the columns `[id_dokter,tanggal_kunjungan]` on the table `Antrean` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_user,tanggal_kunjungan]` on the table `Antrean` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nama_layanan]` on the table `Layanan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nama_tanggungan]` on the table `Tanggungan` will be added. If there are existing duplicate values, this will fail.
  - Made the column `jam_mulai` on table `jadwalpraktik` required. This step will fail if there are existing NULL values in that column.
  - Made the column `jam_selesai` on table `jadwalpraktik` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `antrean` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `beritakesehatan` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `dokter` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `jadwalpraktik` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `jam_mulai` DATETIME(3) NOT NULL,
    MODIFY `jam_selesai` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `layanan` ADD COLUMN `alasan_nonaktif` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `tanggungan` ADD COLUMN `alasan_nonaktif` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `videokesehatan` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `Antrean_status_tanggal_kunjungan_idx` ON `Antrean`(`status`, `tanggal_kunjungan`);

-- CreateIndex
CREATE UNIQUE INDEX `Antrean_id_dokter_tanggal_kunjungan_key` ON `Antrean`(`id_dokter`, `tanggal_kunjungan`);

-- CreateIndex
CREATE UNIQUE INDEX `Antrean_id_user_tanggal_kunjungan_key` ON `Antrean`(`id_user`, `tanggal_kunjungan`);

-- CreateIndex
CREATE INDEX `Layanan_is_active_idx` ON `Layanan`(`is_active`);

-- CreateIndex
CREATE UNIQUE INDEX `Layanan_nama_layanan_key` ON `Layanan`(`nama_layanan`);

-- CreateIndex
CREATE INDEX `Tanggungan_is_active_idx` ON `Tanggungan`(`is_active`);

-- CreateIndex
CREATE UNIQUE INDEX `Tanggungan_nama_tanggungan_key` ON `Tanggungan`(`nama_tanggungan`);
