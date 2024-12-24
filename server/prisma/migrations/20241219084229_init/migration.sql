-- CreateTable
CREATE TABLE `MessageTranslation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `translation` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MessageTranslation_messageId_language_key`(`messageId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MessageTranslation` ADD CONSTRAINT `MessageTranslation_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
