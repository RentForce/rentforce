const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function exportUsers() {
  try {
    // Fetch all users from the User table
    const users = await prisma.user.findMany();

    // Write the data to a JSON file
    fs.writeFileSync("usersBackup.json", JSON.stringify(users, null, 2));

    console.log("User data exported successfully to usersBackup.json");
  } catch (error) {
    console.error("Error exporting user data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

exportUsers();
