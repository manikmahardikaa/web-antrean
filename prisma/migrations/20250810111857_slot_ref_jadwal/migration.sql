/*
  Warnings:

  - You are about to drop the column `id_dokter` on the `slotpraktik` table. All the data in the column will be lost.
  - You are about to drop the column `jam_mulai` on the `slotpraktik` table. All the data in the column will be lost.
  - You are about to drop the column `jam_selesai` on the `slotpraktik` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal` on the `slotpraktik` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_jadwal]` on the table `SlotPraktik` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_jadwal` to the `SlotPraktik` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `slotpraktik` DROP FOREIGN KEY `SlotPraktik_id_dokter_fkey`;

-- DropIndex
DROP INDEX `SlotPraktik_id_dokter_jam_mulai_key` ON `slotpraktik`;

-- DropIndex
DROP INDEX `SlotPraktik_id_dokter_tanggal_idx` ON `slotpraktik`;

-- AlterTable
ALTER TABLE `slotpraktik` DROP COLUMN `id_dokter`,
    DROP COLUMN `jam_mulai`,
    DROP COLUMN `jam_selesai`,
    DROP COLUMN `tanggal`,
    ADD COLUMN `id_jadwal` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `SlotPraktik_id_jadwal_idx` ON `SlotPraktik`(`id_jadwal`);

-- CreateIndex
CREATE UNIQUE INDEX `SlotPraktik_id_jadwal_key` ON `SlotPraktik`(`id_jadwal`);

-- AddForeignKey
ALTER TABLE `SlotPraktik` ADD CONSTRAINT `SlotPraktik_id_jadwal_fkey` FOREIGN KEY (`id_jadwal`) REFERENCES `JadwalPraktik`(`id_jadwal`) ON DELETE CASCADE ON UPDATE CASCADE;
