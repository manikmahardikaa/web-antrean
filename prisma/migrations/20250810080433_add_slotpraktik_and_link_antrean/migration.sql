-- AddForeignKey
ALTER TABLE `Antrean` ADD CONSTRAINT `Antrean_id_dokter_fkey` FOREIGN KEY (`id_dokter`) REFERENCES `Dokter`(`id_dokter`) ON DELETE RESTRICT ON UPDATE CASCADE;
