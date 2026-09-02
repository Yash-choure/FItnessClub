const Membership = require('../models/memberships');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const { SITE_PLANS } = require('./sitePlans');
const { createMemberForUser } = require('./memberProfile');

async function ensureSitePlan(membershipType) {
  const spec = SITE_PLANS[membershipType];
  if (!spec) return null;
  const plan = await Plan.findOneAndUpdate(
    { name: spec.name },
    { $set: { durationDays: spec.durationDays, price: spec.price, features: spec.features, isActive: true } },
    { upsert: true, new: true }
  );
  return plan;
}

async function applyMembershipToUser(user, data) {
  const membershipType = data.membershipType;
  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const plan = await ensureSitePlan(membershipType);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (plan ? plan.durationDays : 30));

  let membership = await Membership.findOne({ user: user._id }).sort({ createdAt: -1 });
  if (membership) {
    membership.name = data.name || membership.name;
    membership.email = data.email || membership.email;
    membership.phone = data.phone || membership.phone;
    membership.address = data.address || membership.address;
    membership.preferredCommunication = data.preferredCommunication || membership.preferredCommunication;
    membership.additionalComments = data.additionalComments;
    membership.membershipType = membershipType;
    membership.startDate = startDate;
    membership.endDate = endDate;
    membership.status = 'active';
    await membership.save();
  } else {
    membership = await Membership.create({
      user: user._id,
      name: data.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      email: data.email || user.email,
      phone: data.phone || '0000000000',
      address: data.address || '-',
      preferredCommunication: data.preferredCommunication || 'email',
      additionalComments: data.additionalComments,
      membershipType,
      startDate,
      endDate,
      status: 'active',
    });
  }

  let member = await Member.findOne({ userId: user._id });
  if (!member) {
    member = await createMemberForUser(user, {
      phone: data.phone,
      address: data.address,
      planId: plan && plan._id,
      validTill: endDate,
      status: 'active',
      extendByPlan: false,
    });
  } else {
    if (plan) member.planId = plan._id;
    if (data.phone && /^\d{10}$/.test(data.phone)) member.phone = data.phone;
    if (data.address) member.address = data.address;
    if (data.name) member.fullName = data.name;
    member.validTill = endDate;
    member.status = 'active';
    await member.save();
  }

  return { membership, member, plan };
}

module.exports = { applyMembershipToUser, ensureSitePlan };
