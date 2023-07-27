/*
  Warnings:

  - You are about to drop the column `weight` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `weight`,
    ADD COLUMN `gender` ENUM('M', 'F', 'O', 'U') NOT NULL DEFAULT 'U';
