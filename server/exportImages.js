const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function exportImages() {
  try {
    // Fetch all images from the Image table
    const images = await prisma.image.findMany();

    // Write the data to a JSON file
    fs.writeFileSync("imagesBackup.json", JSON.stringify(images, null, 2));

    console.log("Image data exported successfully to imagesBackup.json");
  } catch (error) {
    console.error("Error exporting image data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

exportImages();
