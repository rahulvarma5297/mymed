-- DropForeignKey
ALTER TABLE `AuthMode` DROP FOREIGN KEY `AuthMode_userId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicalData` DROP FOREIGN KEY `MedicalData_userId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicalHistory` DROP FOREIGN KEY `MedicalHistory_userId_fkey`;

-- DropForeignKey
ALTER TABLE `RefreshToken` DROP FOREIGN KEY `RefreshToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserMedicalDevice` DROP FOREIGN KEY `UserMedicalDevice_userId_fkey`;

-- AddForeignKey
ALTER TABLE `AuthMode` ADD CONSTRAINT `AuthMode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicalHistory` ADD CONSTRAINT `MedicalHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMedicalDevice` ADD CONSTRAINT `UserMedicalDevice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicalData` ADD CONSTRAINT `MedicalData_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
