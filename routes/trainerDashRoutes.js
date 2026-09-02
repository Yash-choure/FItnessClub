const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const trainerCtrl = require('../controllers/trainerController');

router.get('/', requireAuth(['trainer']), trainerCtrl.dashboard_get);

module.exports = router;
