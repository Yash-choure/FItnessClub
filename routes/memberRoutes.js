const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const memberCtrl = require('../controllers/memberController');

router.get('/dashboard', requireAuth(['member']), memberCtrl.dashboard_get);

module.exports = router;
