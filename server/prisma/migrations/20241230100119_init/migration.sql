-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `type` ENUM('admin', 'host', 'guest') NOT NULL DEFAULT 'guest',
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expoPushToken` VARCHAR(191) NULL,
    `bannedUntil` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `price` DECIMAL(65, 30) NULL,
    `category` ENUM('house', 'apartment', 'villa', 'hotel', 'historical', 'lake', 'beachfront', 'countryside', 'castles', 'experiences', 'camping', 'desert', 'luxe', 'islands') NULL,
    `rating` INTEGER NULL,
    `userId` INTEGER NOT NULL,
    `cancellationPolicy` VARCHAR(191) NULL,
    `roomConfiguration` VARCHAR(191) NULL,
    `houseRules` VARCHAR(191) NULL,
    `safetyProperty` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `guestName` VARCHAR(191) NULL,
    `guestCountry` VARCHAR(191) NULL,
    `propertyDetails` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `numberOfGuests` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `postId` INTEGER NOT NULL,

    UNIQUE INDEX `Image_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Calendar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NULL,
    `isBooked` BOOLEAN NOT NULL,
    `postId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favourite` (
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `postId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `totalPrice` DECIMAL(65, 30) NULL,
    `status` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Cart_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `cartId` INTEGER NOT NULL,

    UNIQUE INDEX `CartPost_postId_key`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `History` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingDate` DATETIME(3) NULL,
    `checkInDate` DATETIME(3) NULL,
    `checkOutDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NULL,
    `totalPrice` DECIMAL(65, 30) NULL,
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,
    `numberOfGuests` INTEGER NULL,

    UNIQUE INDEX `History_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `bookingId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unreadCount` INTEGER NOT NULL DEFAULT 0,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `chatId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `callStatus` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `type` ENUM('TEXT', 'IMAGE', 'SYSTEM', 'NOTIFICATION', 'VOICE', 'VIDEO_CALL', 'AUDIO') NULL DEFAULT 'TEXT',
    `voiceMessagePath` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageTranslation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `translation` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MessageTranslation_messageId_language_key`(`messageId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Map` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `latitude` DECIMAL(65, 30) NULL,
    `longitude` DECIMAL(65, 30) NULL,
    `postId` INTEGER NOT NULL,

    UNIQUE INDEX `Map_postId_key`(`postId`),
    UNIQUE INDEX `Map_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `rating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reasons` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calendar` ADD CONSTRAINT `Calendar_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favourite` ADD CONSTRAINT `Favourite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favourite` ADD CONSTRAINT `Favourite_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartPost` ADD CONSTRAINT `CartPost_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartPost` ADD CONSTRAINT `CartPost_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `History` ADD CONSTRAINT `History_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `History` ADD CONSTRAINT `History_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageTranslation` ADD CONSTRAINT `MessageTranslation_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Map` ADD CONSTRAINT `Map_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
