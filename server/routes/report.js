const express = require('express');
const router = express.Router();
const {
    createReport,
    getUserReports,
    getAllReports,
    authenticateToken,
    resolveReport,
    deleteReport
} = require('../controller/report');

router.post('/', authenticateToken, createReport);
router.get('/all', getAllReports);  
router.get('/post/:postId', authenticateToken, getUserReports);
router.put('/:reportId/resolve', resolveReport);
router.delete('/:reportId',  deleteReport);

module.exports = router;
