-- CreateTable
CREATE TABLE `Uploads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tag` VARCHAR(128) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `path` VARCHAR(256) NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Uploads_id_key`(`id`),
    INDEX `id_userId`(`id`, `userId`, `date`),
    INDEX `user_name_date`(`userId`, `tag`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Uploads` ADD CONSTRAINT `Uploads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
