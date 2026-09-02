const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  details: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
