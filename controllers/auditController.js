const AuditLog = require('../models/AuditLog');

module.exports.list_get = async (req, res) => {
  const logs = await AuditLog.find().populate('actorId').sort({ createdAt: -1 }).limit(200).lean();
  res.render('admin/audit', { title: 'Audit Log', logs });
};
