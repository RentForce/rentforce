const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getPostsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const posts = await prisma.post.findMany({
      where: {
        category: category,
      },
      include: {
        images: true, // This ensures images are fetched with each post
      },
    });

    res.json(posts);
  } catch (error) {
    res.status(500).send({ error });
  }
};

module.exports = {
  getPostsByCategory,
};
