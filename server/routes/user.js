const express = require('express');
const { getUserData, updateUserData } = require('../controller/user');
const router = express.Router();

router.get('/:userId', getUserData);


router.put('/:userId', updateUserData);

module.exports = router;
