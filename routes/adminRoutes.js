const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const memberCtrl = require('../controllers/memberController');
const planCtrl = require('../controllers/planController');
const trainerCtrl = require('../controllers/trainerController');
const reportCtrl = require('../controllers/reportController');
const paymentCtrl = require('../controllers/paymentController');
const auditCtrl = require('../controllers/auditController');
const upload = require('../middlewares/uploadMiddleware');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Trainer = require('../models/Trainer');
const Payment = require('../models/Payment');
const User = require('../models/user');
const Membership = require('../models/memberships');
const { syncMissingMemberProfiles } = require('../utils/memberProfile');

const adminOnly = requireAuth(['admin']);

router.get('/dashboard', adminOnly, async (req, res) => {
  await syncMissingMemberProfiles();
  const today = new Date();
  const week = new Date();
  week.setDate(week.getDate() + 7);

  const [totalUsers, totalMembers, activeMembers, frozenMembers, expiredMembers, planCount, trainerCount, paymentCount, expiringSoon, recentPayments, recentUsers, recentMemberships, revenueByMonth] =
    await Promise.all([
      User.countDocuments({ role: 'member' }),
      Member.countDocuments(),
      Member.countDocuments({ status: 'active' }),
      Member.countDocuments({ status: 'frozen' }),
      Member.countDocuments({ status: 'expired' }),
      Plan.countDocuments({ isActive: true }),
      Trainer.countDocuments(),
      Payment.countDocuments(),
      Member.find({ status: { $ne: 'frozen' }, validTill: { $gte: today, $lte: week } }).populate('planId').lean(),
      Payment.find().sort({ paidOn: -1 }).limit(5).populate('memberId').lean(),
      User.find({ role: 'member' }).sort({ createdAt: -1 }).limit(8).lean(),
      Membership.find().sort({ createdAt: -1 }).limit(8).populate('user').lean(),
      Payment.aggregate([
        {
          $group: {
            _id: { year: { $year: '$paidOn' }, month: { $month: '$paidOn' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats: { totalUsers, totalMembers, activeMembers, frozenMembers, expiredMembers, planCount, trainerCount, paymentCount },
    expiringSoon,
    recentPayments,
    recentUsers,
    recentMemberships,
    revenueChart: revenueByMonth,
  });
});

router.get('/users', adminOnly, memberCtrl.users_get);
router.get('/members', adminOnly, memberCtrl.list_get);
router.get('/members/new', adminOnly, memberCtrl.new_get);
router.post('/members', adminOnly, upload.single('photo'), memberCtrl.create_post);
router.get('/members/:id', adminOnly, memberCtrl.show_get);
router.put('/members/:id', adminOnly, memberCtrl.update_put);

router.get('/plans', adminOnly, planCtrl.list_get);
router.get('/plans/new', adminOnly, planCtrl.new_get);
router.get('/plans/:id/edit', adminOnly, planCtrl.edit_get);
router.post('/plans', adminOnly, planCtrl.create_post);
router.put('/plans/:id', adminOnly, planCtrl.update_put);
router.delete('/plans/:id', adminOnly, planCtrl.delete_delete);

router.get('/trainers', adminOnly, trainerCtrl.list_get);
router.get('/trainers/:id/edit', adminOnly, trainerCtrl.edit_get);
router.post('/trainers', adminOnly, trainerCtrl.create_post);
router.put('/trainers/:id', adminOnly, trainerCtrl.update_put);
router.post('/trainers/:id/assign/:memberId', adminOnly, trainerCtrl.assign_post);

router.get('/audit', adminOnly, auditCtrl.list_get);

router.get('/payments', adminOnly, paymentCtrl.list_get);
router.post('/payments', adminOnly, paymentCtrl.processPayment);

router.get('/reports/active', adminOnly, reportCtrl.active_get);
router.get('/reports/dues', adminOnly, reportCtrl.dues_get);
router.get('/reports/revenue', adminOnly, reportCtrl.revenue_get);
router.get('/reports/load', adminOnly, reportCtrl.trainerLoad_get);

module.exports = router;
