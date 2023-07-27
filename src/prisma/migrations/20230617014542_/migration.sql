/*
  Warnings:

  - A unique constraint covering the columns `[userId,id]` on the table `MedicalData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `MedicalData_userId_id_key` ON `MedicalData`(`userId`, `id`);
