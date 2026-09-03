const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Trainer = require('../models/Trainer');
const { syncExpiredMembers } = require('../utils/expiryReminder');

function sendCsv(res, filename, header, lines) {
  const body = [header, ...lines]
    .map((cols) => cols.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}

module.exports.active_get = async (req, res) => {
  const rows = await Member.aggregate([
    { $match: { status: 'active' } },
    { $lookup: { from: 'plans', localField: 'planId', foreignField: '_id', as: 'plan' } },
    { $lookup: { from: 'trainers', localField: 'trainerId', foreignField: '_id', as: 'trainer' } },
    { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$trainer', preserveNullAndEmptyArrays: true } },
    { $project: { fullName: 1, validTill: 1, planName: '$plan.name', trainerName: '$trainer.fullName' } },
  ]);
  if (req.query.export === 'csv') {
    return sendCsv(
      res,
      'active-members.csv',
      ['Name', 'Plan', 'Trainer', 'Valid till'],
      rows.map((r) => [
        r.fullName,
        r.planName || '',
        r.trainerName || 'Unassigned',
        r.validTill ? new Date(r.validTill).toLocaleDateString('en-IN') : '',
      ])
    );
  }
  res.render('admin/report', { title: 'Active Members Report', reportType: 'active', rows });
};

module.exports.dues_get = async (req, res) => {
  await syncExpiredMembers();
  const today = new Date();
  const members = await Member.find({ validTill: { $lt: today }, status: { $ne: 'frozen' } })
    .sort({ validTill: 1 })
    .lean();
  const rows = members.map((r) => ({
    ...r,
    daysOverdue: Math.floor((today - new Date(r.validTill)) / 86400000),
  }));
  if (req.query.export === 'csv') {
    return sendCsv(
      res,
      'pending-dues.csv',
      ['Name', 'Valid till', 'Days overdue', 'Status'],
      rows.map((r) => [r.fullName, r.validTill ? new Date(r.validTill).toLocaleDateString('en-IN') : '', r.daysOverdue, r.status])
    );
  }
  res.render('admin/report', { title: 'Pending Dues Report', reportType: 'dues', rows });
};

module.exports.revenue_get = async (req, res) => {
  const rows = await Payment.aggregate([
    {
      $group: {
        _id: { year: { $year: '$paidOn' }, month: { $month: '$paidOn' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        byMode: { $push: { mode: '$mode', amount: '$amount' } },
      },
    },
    { $set: {
      cash: { $sum: { $map: { input: { $filter: { input: '$byMode', as: 'payment', cond: { $eq: ['$$payment.mode', 'cash'] } } }, as: 'payment', in: '$$payment.amount' } } },
      upi: { $sum: { $map: { input: { $filter: { input: '$byMode', as: 'payment', cond: { $eq: ['$$payment.mode', 'upi'] } } }, as: 'payment', in: '$$payment.amount' } } },
      card: { $sum: { $map: { input: { $filter: { input: '$byMode', as: 'payment', cond: { $eq: ['$$payment.mode', 'card'] } } }, as: 'payment', in: '$$payment.amount' } } },
      online: { $sum: { $map: { input: { $filter: { input: '$byMode', as: 'payment', cond: { $eq: ['$$payment.mode', 'online'] } } }, as: 'payment', in: '$$payment.amount' } } },
    } },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
  ]);
  if (req.query.export === 'csv') {
    return sendCsv(
      res,
      'monthly-revenue.csv',
      ['Month', 'Payments', 'Total revenue', 'Cash', 'UPI', 'Card', 'Online'],
      rows.map((r) => [`${r._id.month}/${r._id.year}`, r.count, Number(r.total).toFixed(2), Number(r.cash).toFixed(2), Number(r.upi).toFixed(2), Number(r.card).toFixed(2), Number(r.online).toFixed(2)])
    );
  }
  res.render('admin/report', { title: 'Monthly Revenue Report', reportType: 'revenue', rows });
};

module.exports.trainerLoad_get = async (req, res) => {
  const rows = await Member.aggregate([
    { $match: { status: 'active', trainerId: { $ne: null } } },
    { $group: { _id: '$trainerId', count: { $sum: 1 } } },
    { $lookup: { from: 'trainers', localField: '_id', foreignField: '_id', as: 'trainer' } },
    { $unwind: { path: '$trainer', preserveNullAndEmptyArrays: true } },
    { $sort: { count: -1 } },
  ]);
  const unassigned = await Member.countDocuments({ status: 'active', trainerId: null });
  if (req.query.export === 'csv') {
    return sendCsv(
      res,
      'trainer-load.csv',
      ['Trainer', 'Active members'],
      rows.map((r) => [r.trainer ? r.trainer.fullName : 'Unknown', r.count])
    );
  }
  res.render('admin/report', {
    title: 'Trainer-wise Load Report',
    reportType: 'load',
    rows,
    extra: { unassigned, trainerCount: await Trainer.countDocuments() },
  });
};
