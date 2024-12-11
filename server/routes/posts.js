const express = require('express');
const { getPostsByCategory } = require('../controller/posts');
const router = express.Router();

router.get('/:category', getPostsByCategory);

module.exports = router;
