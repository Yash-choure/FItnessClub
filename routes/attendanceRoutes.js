const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { verifyCsrf } = require('../middlewares/csrfMiddleware');
const attendanceController = require('../controllers/attendanceController');

router.get('/', requireAuth(['admin', 'trainer']), attendanceController.list_get);
router.post('/', requireAuth(['admin', 'trainer']), verifyCsrf, attendanceController.mark_post);

module.exports = router;
