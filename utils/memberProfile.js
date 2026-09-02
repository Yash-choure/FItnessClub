const Member = require('../models/Member');
const Plan = require('../models/Plan');

async function createMemberForUser(user, extras = {}) {
  const existing = await Member.findOne({ userId: user._id });
  if (existing) return existing;

  const fullName = extras.fullName
    || [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    || user.username;

  let plan = null;
  if (extras.planId) {
    plan = await Plan.findById(extras.planId);
  }
  if (!plan && extras.allowDefaultPlan) {
    plan = await Plan.findOne({ isActive: true }).sort({ durationDays: 1 });
  }

  const validTill = extras.validTill ? new Date(extras.validTill) : new Date();
  if (plan && extras.extendByPlan !== false && !extras.validTill) {
    validTill.setDate(validTill.getDate() + (plan.durationDays || 0));
  }

  return Member.create({
    userId: user._id,
    fullName,
    phone: extras.phone && /^\d{10}$/.test(extras.phone) ? extras.phone : '0000000000',
    dob: extras.dob ? new Date(extras.dob) : new Date('2000-01-01'),
    gender: extras.gender || 'O',
    address: extras.address || '',
    photoUrl: extras.photoUrl,
    planId: plan ? plan._id : undefined,
    validTill,
    status: extras.status || (plan ? 'active' : 'expired'),
  });
}

async function syncMissingMemberProfiles() {
  const User = require('../models/user');
  const users = await User.find({ role: 'member' });
  for (const user of users) {
    await createMemberForUser(user, { extendByPlan: false, status: 'expired' });
  }
}

module.exports = { createMemberForUser, syncMissingMemberProfiles };
