const express = require('express');
const router = express.Router();
const {
    createReport,
    getUserReports,
    authenticateToken

} = require('../controller/report');

// Create a new report
router.post('/', authenticateToken, createReport);


router.get('/post/:postId', authenticateToken, getUserReports);



module.exports = router;
