/*
  Warnings:

  - The primary key for the `antrean` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `beritakesehatan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `dokter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `jadwalpraktik` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `layanan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tanggungan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `videokesehatan` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_dokter_fkey`;

-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_layanan_fkey`;

-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_user_fkey`;

-- DropForeignKey
ALTER TABLE `jadwalpraktik` DROP FOREIGN KEY `JadwalPraktik_id_dokter_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_id_layanan_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_id_tanggungan_fkey`;

-- DropIndex
DROP INDEX `Antrean_id_dokter_fkey` ON `antrean`;

-- DropIndex
DROP INDEX `Antrean_id_layanan_fkey` ON `antrean`;

-- DropIndex
DROP INDEX `Antrean_id_user_fkey` ON `antrean`;

-- DropIndex
DROP INDEX `JadwalPraktik_id_dokter_fkey` ON `jadwalpraktik`;

-- DropIndex
DROP INDEX `User_id_layanan_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_id_tanggungan_fkey` ON `user`;

-- AlterTable
ALTER TABLE `antrean` DROP PRIMARY KEY,
    MODIFY `id_antrean` VARCHAR(191) NOT NULL,
    MODIFY `id_user` VARCHAR(191) NOT NULL,
    MODIFY `id_dokter` VARCHAR(191) NOT NULL,
    MODIFY `id_layanan` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_antrean`);

-- AlterTable
ALTER TABLE `beritakesehatan` DROP PRIMARY KEY,
    MODIFY `id_berita` VARCHAR(191) NOT NULL,
    MODIFY `foto_url` LONGTEXT NOT NULL,
    ADD PRIMARY KEY (`id_berita`);

-- AlterTable
ALTER TABLE `dokter` DROP PRIMARY KEY,
    MODIFY `id_dokter` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_dokter`);

-- AlterTable
ALTER TABLE `jadwalpraktik` DROP PRIMARY KEY,
    MODIFY `id_jadwal` VARCHAR(191) NOT NULL,
    MODIFY `id_dokter` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_jadwal`);

-- AlterTable
ALTER TABLE `layanan` DROP PRIMARY KEY,
    MODIFY `id_layanan` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_layanan`);

-- AlterTable
ALTER TABLE `tanggungan` DROP PRIMARY KEY,
    MODIFY `id_tanggungan` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_tanggungan`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id_user` VARCHAR(191) NOT NULL,
    MODIFY `id_layanan` VARCHAR(191) NOT NULL,
    MODIFY `id_tanggungan` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_user`);

-- AlterTable
ALTER TABLE `videokesehatan` DROP PRIMARY KEY,
    MODIFY `id_video` VARCHAR(191) NOT NULL,
    MODIFY `video_url` LONGTEXT NOT NULL,
    ADD PRIMARY KEY (`id_video`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_layanan_fkey` FOREIGN KEY (`id_layanan`) REFERENCES `Layanan`(`id_layanan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_tanggungan_fkey` FOREIGN KEY (`id_tanggungan`) REFERENCES `Tanggungan`(`id_tanggungan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JadwalPraktik` ADD CONSTRAINT `JadwalPraktik_id_dokter_fkey` FOREIGN KEY (`id_dokter`) REFERENCES `Dokter`(`id_dokter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_dokter_fkey` FOREIGN KEY (`id_dokter`) REFERENCES `Dokter`(`id_dokter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_layanan_fkey` FOREIGN KEY (`id_layanan`) REFERENCES `Layanan`(`id_layanan`) ON DELETE RESTRICT ON UPDATE CASCADE;
