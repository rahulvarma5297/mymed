-- CreateTable
CREATE TABLE `HealthParamRanges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `min` FLOAT NOT NULL,
    `max` FLOAT NOT NULL,
    `description` VARCHAR(128) NULL,
    `color` VARCHAR(8) NOT NULL,
    `unitsId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HealthParamRanges_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HealthParamRanges` ADD CONSTRAINT `HealthParamRanges_unitsId_fkey` FOREIGN KEY (`unitsId`) REFERENCES `HealthParamUnits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
