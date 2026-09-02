const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const paymentCtrl = require('../controllers/paymentController');

router.get('/receipt/:receiptNo', requireAuth(['admin', 'member']), paymentCtrl.receipt_by_no_get);
router.get('/:id/receipt', requireAuth(['admin', 'member']), paymentCtrl.receipt_get);

module.exports = router;
