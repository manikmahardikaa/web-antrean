/*
  Warnings:

  - You are about to drop the column `alamat_User` on the `antrean` table. All the data in the column will be lost.
  - Added the required column `alamat_user` to the `Antrean` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `antrean` DROP COLUMN `alamat_User`,
    ADD COLUMN `alamat_user` VARCHAR(191) NOT NULL,
    ADD COLUMN `alasan_batal` VARCHAR(191) NULL,
    ADD COLUMN `dokter_nama_snapshot` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `dokter` ADD COLUMN `alasan_nonaktif` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `Dokter_is_active_idx` ON `Dokter`(`is_active`);
