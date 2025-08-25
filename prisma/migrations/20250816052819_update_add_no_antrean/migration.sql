/*
  Warnings:

  - You are about to drop the column `tanggal_kunjungan` on the `antrean` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_user,tanggal_lahir]` on the table `Antrean` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_slot,no_antrean]` on the table `Antrean` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tanggal_lahir` to the `Antrean` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_user_fkey`;

-- DropIndex
DROP INDEX `Antrean_id_user_tanggal_kunjungan_key` ON `antrean`;

-- DropIndex
DROP INDEX `Antrean_status_tanggal_kunjungan_idx` ON `antrean`;

-- DropIndex
DROP INDEX `Antrean_tanggal_kunjungan_idx` ON `antrean`;

-- AlterTable
ALTER TABLE `antrean` DROP COLUMN `tanggal_kunjungan`,
    ADD COLUMN `no_antrean` INTEGER NULL,
    ADD COLUMN `tanggal_lahir` DATE NOT NULL;

-- AlterTable
ALTER TABLE `beritakesehatan` MODIFY `tanggal_penerbitan` DATE NOT NULL;

-- AlterTable
ALTER TABLE `videokesehatan` MODIFY `tanggal_penerbitan` DATE NOT NULL;

-- CreateIndex
CREATE INDEX `Antrean_tanggal_lahir_idx` ON `Antrean`(`tanggal_lahir`);

-- CreateIndex
CREATE INDEX `Antrean_status_tanggal_lahir_idx` ON `Antrean`(`status`, `tanggal_lahir`);

-- CreateIndex
CREATE UNIQUE INDEX `Antrean_id_user_tanggal_lahir_key` ON `Antrean`(`id_user`, `tanggal_lahir`);

-- CreateIndex
CREATE UNIQUE INDEX `Antrean_id_slot_no_antrean_key` ON `Antrean`(`id_slot`, `no_antrean`);

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
