/*
  Warnings:

  - A unique constraint covering the columns `[id_slot,nama_pasien,tanggal_lahir,status]` on the table `Antrean` will be added. If there are existing duplicate values, this will fail.
  - Made the column `jenis_kelamin` on table `antrean` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nama_pasien` on table `antrean` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telepon` on table `antrean` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `antrean` DROP FOREIGN KEY `Antrean_id_user_fkey`;

-- DropIndex
DROP INDEX `Antrean_id_user_id_slot_key` ON `antrean`;

-- DropIndex
DROP INDEX `Antrean_id_user_tanggal_lahir_key` ON `antrean`;

-- AlterTable
ALTER TABLE `antrean` MODIFY `jenis_kelamin` VARCHAR(191) NOT NULL,
    MODIFY `nama_pasien` VARCHAR(191) NOT NULL,
    MODIFY `telepon` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Antrean_id_slot_nama_pasien_tanggal_lahir_status_key` ON `Antrean`(`id_slot`, `nama_pasien`, `tanggal_lahir`, `status`);

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
