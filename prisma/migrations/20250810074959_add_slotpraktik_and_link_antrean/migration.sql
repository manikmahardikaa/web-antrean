/*
  Warnings:

  - A unique constraint covering the columns `[id_user,id_slot]` on the table `Antrean` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_slot` to the `Antrean` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_dokter_fkey`;

-- DropIndex
DROP INDEX `Antrean_id_dokter_tanggal_kunjungan_key` ON `antrean`;

-- AlterTable
ALTER TABLE `antrean` ADD COLUMN `id_slot` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `SlotPraktik` (
    `id_slot` VARCHAR(191) NOT NULL,
    `id_dokter` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `jam_mulai` DATETIME(3) NOT NULL,
    `jam_selesai` DATETIME(3) NOT NULL,
    `kapasitas` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SlotPraktik_id_dokter_tanggal_idx`(`id_dokter`, `tanggal`),
    UNIQUE INDEX `SlotPraktik_id_dokter_jam_mulai_key`(`id_dokter`, `jam_mulai`),
    PRIMARY KEY (`id_slot`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Antrean_id_slot_idx` ON `Antrean`(`id_slot`);

-- CreateIndex
CREATE INDEX `Antrean_id_slot_createdAt_idx` ON `Antrean`(`id_slot`, `createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `Antrean_id_user_id_slot_key` ON `Antrean`(`id_user`, `id_slot`);

-- AddForeignKey
ALTER TABLE `SlotPraktik` ADD CONSTRAINT `SlotPraktik_id_dokter_fkey` FOREIGN KEY (`id_dokter`) REFERENCES `Dokter`(`id_dokter`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_slot_fkey` FOREIGN KEY (`id_slot`) REFERENCES `SlotPraktik`(`id_slot`) ON DELETE RESTRICT ON UPDATE CASCADE;
