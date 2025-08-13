-- AlterTable
ALTER TABLE `antrean` ADD COLUMN `id_tanggungan` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Antrean_id_tanggungan_idx` ON `Antrean`(`id_tanggungan`);

-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_tanggungan_fkey` FOREIGN KEY (`id_tanggungan`) REFERENCES `Tanggungan`(`id_tanggungan`) ON DELETE SET NULL ON UPDATE CASCADE;
