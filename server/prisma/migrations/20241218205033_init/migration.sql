/*
  Warnings:

  - You are about to alter the column `status` on the `calllog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `calllog` MODIFY `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` ENUM('ONGOING', 'COMPLETED', 'MISSED', 'REJECTED', 'FAILED') NOT NULL DEFAULT 'MISSED';

-- AddForeignKey
ALTER TABLE `CallLog` ADD CONSTRAINT `CallLog_callerId_fkey` FOREIGN KEY (`callerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CallLog` ADD CONSTRAINT `CallLog_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
