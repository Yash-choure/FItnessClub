const AuditLog = require('../models/AuditLog');

async function logAudit(req, { action, entity, entityId, details }) {
  try {
    const actorId = (req.userJwt && req.userJwt.id) || (req.user && req.user._id) || null;
    const actorRole = (req.userJwt && req.userJwt.role) || (req.user && req.user.role) || 'unknown';
    await AuditLog.create({
      actorId,
      actorRole,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      details,
    });
  } catch (err) {
    console.warn('Audit log failed:', err.message);
  }
}

module.exports = { logAudit };
