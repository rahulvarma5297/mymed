/*
  Warnings:

  - You are about to drop the `Uploads` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Uploads` DROP FOREIGN KEY `Uploads_userId_fkey`;

-- DropTable
DROP TABLE `Uploads`;

-- CreateTable
CREATE TABLE `Documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tag` VARCHAR(128) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `path` VARCHAR(256) NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Documents_id_key`(`id`),
    INDEX `user_name_date`(`userId`, `tag`, `date`),
    UNIQUE INDEX `Documents_id_userId_key`(`id`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Documents` ADD CONSTRAINT `Documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
