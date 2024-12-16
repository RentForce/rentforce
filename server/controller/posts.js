const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getPostsByCategory = async (req, res) => {
  const { category } = req.params;
  const { search, price, location, title } = req.query;

  try {
    console.log("Category:", category);
    console.log("Search query:", search);

    const posts = await prisma.post.findMany({
      where: {
        ...(category !== "all" && { category: category }),
        ...(search && {
          OR: [
            { title: { contains: search } },
            { location: { contains: search } },
            { description: { contains: search } },
          ],
        }),
        ...(price && { price: { lte: parseFloat(price) } }),
        ...(location && { location: { contains: location } }),
        ...(title && { title: { contains: title } }),
      },
      include: {
        images: true,
      },
    });

    console.log("Found posts:", posts.length);

    res.json(posts);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

const getImagesByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    const images = await prisma.image.findMany({
      where: {
        postId: parseInt(postId),
      },
    });

    if (!images || images.length === 0) {
      return res.status(404).json({ message: "No images found for this post" });
    }

    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res
      .status(500)
      .json({ message: "Error fetching images", error: error.message });
  }
};

module.exports = {
  getPostsByCategory,
  getImagesByPostId,
};
