/*
  Warnings:

  - The primary key for the `antrean` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_antrean` on the `antrean` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_user` on the `antrean` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_dokter` on the `antrean` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_layanan` on the `antrean` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_tanggungan` on the `antrean` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_slot` on the `antrean` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `beritakesehatan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_berita` on the `beritakesehatan` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `dokter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_dokter` on the `dokter` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `jadwalpraktik` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_jadwal` on the `jadwalpraktik` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_dokter` on the `jadwalpraktik` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `layanan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_layanan` on the `layanan` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `slotpraktik` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_slot` on the `slotpraktik` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_jadwal` on the `slotpraktik` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `tanggungan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_tanggungan` on the `tanggungan` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_user` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_layanan` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `id_tanggungan` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `videokesehatan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id_video` on the `videokesehatan` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.

*/
-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_dokter_fkey`;

-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_layanan_fkey`;

-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_slot_fkey`;

-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_tanggungan_fkey`;

-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_user_fkey`;

-- DropForeignKey
ALTER TABLE `jadwalpraktik` DROP FOREIGN KEY `JadwalPraktik_id_dokter_fkey`;

-- DropForeignKey
ALTER TABLE `slotpraktik` DROP FOREIGN KEY `SlotPraktik_id_jadwal_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_id_layanan_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_id_tanggungan_fkey`;

-- AlterTable
ALTER TABLE `antrean` DROP PRIMARY KEY,
    MODIFY `id_antrean` CHAR(36) NOT NULL,
    MODIFY `id_user` CHAR(36) NOT NULL,
    MODIFY `id_dokter` CHAR(36) NOT NULL,
    MODIFY `id_layanan` CHAR(36) NOT NULL,
    MODIFY `id_tanggungan` CHAR(36) NULL,
    MODIFY `id_slot` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_antrean`);

-- AlterTable
ALTER TABLE `beritakesehatan` DROP PRIMARY KEY,
    MODIFY `id_berita` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_berita`);

-- AlterTable
ALTER TABLE `dokter` DROP PRIMARY KEY,
    MODIFY `id_dokter` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_dokter`);

-- AlterTable
ALTER TABLE `jadwalpraktik` DROP PRIMARY KEY,
    MODIFY `id_jadwal` CHAR(36) NOT NULL,
    MODIFY `id_dokter` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_jadwal`);

-- AlterTable
ALTER TABLE `layanan` DROP PRIMARY KEY,
    MODIFY `id_layanan` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_layanan`);

-- AlterTable
ALTER TABLE `slotpraktik` DROP PRIMARY KEY,
    MODIFY `id_slot` CHAR(36) NOT NULL,
    MODIFY `id_jadwal` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_slot`);

-- AlterTable
ALTER TABLE `tanggungan` DROP PRIMARY KEY,
    MODIFY `id_tanggungan` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_tanggungan`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id_user` CHAR(36) NOT NULL,
    MODIFY `id_layanan` CHAR(36) NULL,
    MODIFY `id_tanggungan` CHAR(36) NULL,
    ADD PRIMARY KEY (`id_user`);

-- AlterTable
ALTER TABLE `videokesehatan` DROP PRIMARY KEY,
    MODIFY `id_video` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id_video`);

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
