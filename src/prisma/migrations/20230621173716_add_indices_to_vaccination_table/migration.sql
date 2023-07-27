-- CreateIndex
CREATE INDEX `id_userId` ON `Vaccination`(`id`, `userId`, `date`);

-- CreateIndex
CREATE INDEX `user_name_date` ON `Vaccination`(`userId`, `name`, `date`);
