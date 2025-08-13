/*
  Warnings:

  - You are about to drop the column `alamat` on the `antrean` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `antrean` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - Added the required column `alamat_User` to the `Antrean` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `jadwalpraktik` DROP FOREIGN KEY `JadwalPraktik_id_dokter_fkey`;

-- DropIndex
DROP INDEX `JadwalPraktik_id_dokter_fkey` ON `jadwalpraktik`;

-- AlterTable
ALTER TABLE `antrean` DROP COLUMN `alamat`,
    ADD COLUMN `alamat_User` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('MENUNGGU', 'DIPROSES', 'SELESAI', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU';

-- AlterTable
ALTER TABLE `user` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `Antrean_tanggal_kunjungan_idx` ON `Antrean`(`tanggal_kunjungan`);

-- CreateIndex
CREATE INDEX `BeritaKesehatan_tanggal_penerbitan_idx` ON `BeritaKesehatan`(`tanggal_penerbitan`);

-- CreateIndex
CREATE INDEX `Dokter_nama_dokter_idx` ON `Dokter`(`nama_dokter`);

-- CreateIndex
CREATE INDEX `Dokter_spesialisasi_idx` ON `Dokter`(`spesialisasi`);

-- CreateIndex
CREATE INDEX `JadwalPraktik_id_dokter_tanggal_idx` ON `JadwalPraktik`(`id_dokter`, `tanggal`);

-- CreateIndex
CREATE INDEX `Layanan_nama_layanan_idx` ON `Layanan`(`nama_layanan`);

-- CreateIndex
CREATE INDEX `Tanggungan_nama_tanggungan_idx` ON `Tanggungan`(`nama_tanggungan`);

-- CreateIndex
CREATE INDEX `VideoKesehatan_tanggal_penerbitan_idx` ON `VideoKesehatan`(`tanggal_penerbitan`);

-- AddForeignKey
ALTER TABLE `JadwalPraktik` ADD CONSTRAINT `JadwalPraktik_id_dokter_fkey` FOREIGN KEY (`id_dokter`) REFERENCES `Dokter`(`id_dokter`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `antrean` RENAME INDEX `Antrean_id_dokter_fkey` TO `Antrean_id_dokter_idx`;

-- RenameIndex
ALTER TABLE `antrean` RENAME INDEX `Antrean_id_layanan_fkey` TO `Antrean_id_layanan_idx`;

-- RenameIndex
ALTER TABLE `antrean` RENAME INDEX `Antrean_id_user_fkey` TO `Antrean_id_user_idx`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_id_layanan_fkey` TO `User_id_layanan_idx`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_id_tanggungan_fkey` TO `User_id_tanggungan_idx`;
