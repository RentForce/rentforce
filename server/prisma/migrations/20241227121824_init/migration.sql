/*
  Warnings:

  - Made the column `type` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `type` ENUM('admin', 'host', 'guest') NOT NULL DEFAULT 'guest';
