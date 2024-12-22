// server/exportPosts.js
require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function exportPosts() {
  try {
    // Fetch all posts from the Post table
    const posts = await prisma.post.findMany();

    // Write the data to a JSON file
    fs.writeFileSync("postsBackup.json", JSON.stringify(posts, null, 2));

    console.log("Data exported successfully to postsBackup.json");
  } catch (error) {
    console.error("Error exporting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

exportPosts();
