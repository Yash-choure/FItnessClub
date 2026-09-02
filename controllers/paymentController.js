const Payment = require('../models/Payment');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const mongoose = require('mongoose');
const { streamReceiptPDF } = require('../utils/pdfGenerator');
const { logAudit } = require('../utils/auditLog');

module.exports.list_get = async (req, res) => {
  const payments = await Payment.find()
    .populate('memberId')
    .populate('planId')
    .sort({ paidOn: -1 })
    .lean();
  const members = await Member.find().lean();
  const plans = await Plan.find({ isActive: true }).lean();
  res.render('admin/payments', { title: 'Payments', payments, members, plans });
};

module.exports.processPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { memberId, planId, amount, mode } = req.body;
    const adminId = req.userJwt.id;

    const plan = await Plan.findById(planId).session(session);
    if (!plan || !plan.isActive) throw new Error('Referenced plan not found or inactive.');
    if (parseFloat(amount) < Number(plan.price)) {
      throw new Error(`Amount Rs.${amount} does not meet plan price Rs.${plan.price}.`);
    }

    const count = await Payment.countDocuments().session(session);
    const receiptNo = `RCPT-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const [payment] = await Payment.create(
      [{ memberId, planId, amount: parseFloat(amount), mode, receiptNo, recordedBy: adminId }],
      { session }
    );

    const member = await Member.findById(memberId).session(session);
    if (!member) throw new Error('Member not found in database.');

    const now = new Date();
    const baseDate = member.validTill && member.validTill > now ? new Date(member.validTill) : now;
    baseDate.setDate(baseDate.getDate() + plan.durationDays);
    member.validTill = baseDate;
    member.status = 'active';
    member.planId = planId;
    await member.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAudit(req, { action: 'create', entity: 'Payment', entityId: payment._id, details: receiptNo });
    req.flash('success_msg', `Payment recorded. Receipt ${receiptNo}`);
    res.redirect(`/payments/${payment._id}/receipt`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    req.flash('error_msg', error.message);
    res.redirect('/admin/payments');
  }
};

async function canViewReceipt(req, payment) {
  if (!payment) return false;
  if (req.userJwt.role === 'admin') return true;
  if (req.userJwt.role !== 'member') return false;
  const member = await Member.findOne({ userId: req.userJwt.id });
  const paymentMemberId = payment.memberId && payment.memberId._id ? payment.memberId._id : payment.memberId;
  return member && String(paymentMemberId) === String(member._id);
}

function failReceipt(req, res) {
  const dest = req.userJwt && req.userJwt.role === 'member' ? '/members/dashboard' : '/admin/payments';
  req.flash('error_msg', 'Receipt not found or not allowed.');
  return res.redirect(dest);
}

module.exports.receipt_get = async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('memberId').populate('planId');
  if (!(await canViewReceipt(req, payment))) return failReceipt(req, res);
  streamReceiptPDF(res, payment, payment.memberId, payment.planId);
};

module.exports.receipt_by_no_get = async (req, res) => {
  const payment = await Payment.findOne({ receiptNo: req.params.receiptNo }).populate('memberId').populate('planId');
  if (!(await canViewReceipt(req, payment))) return failReceipt(req, res);
  streamReceiptPDF(res, payment, payment.memberId, payment.planId);
};
