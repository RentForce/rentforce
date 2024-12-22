const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const fs = require("fs");

const prisma = new PrismaClient();

async function exportImages() {
  try {
    // Fetch all images from the Image table
    const images = await prisma.image.findMany({
      select: {
        id: true,
        url: true,
        postId: true,
      },
    });

    // Write the data to a JSON file
    fs.writeFileSync("imagesBackup.json", JSON.stringify(images, null, 2));

    console.log(
      `Successfully exported ${images.length} images to imagesBackup.json`
    );
  } catch (error) {
    console.error("Error exporting image data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
exportImages();
