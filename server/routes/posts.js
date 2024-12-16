const express = require("express");
const {
  getPostsByCategory,
  getImagesByPostId,
} = require("../controller/posts");
const router = express.Router();

router.get("/all", getPostsByCategory);
router.get("/:category", getPostsByCategory);
router.get("/images/:postId", getImagesByPostId);

module.exports = router;
