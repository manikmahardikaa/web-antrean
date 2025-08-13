-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_id_layanan_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_id_tanggungan_fkey`;

-- DropIndex
DROP INDEX `User_id_layanan_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_id_tanggungan_fkey` ON `user`;

-- AlterTable
ALTER TABLE `user` MODIFY `id_layanan` VARCHAR(191) NULL,
    MODIFY `id_tanggungan` VARCHAR(191) NULL,
    MODIFY `alamat` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_layanan_fkey` FOREIGN KEY (`id_layanan`) REFERENCES `Layanan`(`id_layanan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_tanggungan_fkey` FOREIGN KEY (`id_tanggungan`) REFERENCES `Tanggungan`(`id_tanggungan`) ON DELETE SET NULL ON UPDATE CASCADE;
