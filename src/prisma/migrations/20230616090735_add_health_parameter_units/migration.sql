/*
  Warnings:

  - Added the required column `unitsId` to the `MedicalData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MedicalData` ADD COLUMN `unitsId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `HealthParamUnits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nameSV` VARCHAR(128) NOT NULL,
    `nameEN` VARCHAR(128) NOT NULL,
    `unit` VARCHAR(128) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HealthParamUnits_id_key`(`id`),
    UNIQUE INDEX `HealthParamUnits_nameSV_key`(`nameSV`),
    UNIQUE INDEX `HealthParamUnits_nameEN_key`(`nameEN`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MedicalData` ADD CONSTRAINT `MedicalData_unitsId_fkey` FOREIGN KEY (`unitsId`) REFERENCES `HealthParamUnits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
