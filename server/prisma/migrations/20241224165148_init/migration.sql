-- AlterTable
ALTER TABLE `chat` ADD COLUMN `unreadCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `message` ADD COLUMN `read` BOOLEAN NOT NULL DEFAULT false;
