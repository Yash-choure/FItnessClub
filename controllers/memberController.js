const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Member = require('../models/Member');
const User = require('../models/user');
const Plan = require('../models/Plan');
const Trainer = require('../models/Trainer');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Membership = require('../models/memberships');
const { memberSchema, memberUpdateSchema } = require('../utils/validators');
const { syncMissingMemberProfiles } = require('../utils/memberProfile');
const { logAudit } = require('../utils/auditLog');
const { syncExpiredMembers } = require('../utils/expiryReminder');

module.exports.list_get = async (req, res) => {
  try {
    await syncMissingMemberProfiles();
    await syncExpiredMembers();
    const members = await Member.find().populate('planId').populate('trainerId').populate('userId').lean();
    const today = new Date();
    members.forEach((m) => {
      m.isExpired = m.validTill < today && m.status !== 'frozen';
    });
    res.render('admin/members', { title: 'Manage Members', members });
  } catch (err) {
    req.flash('error_msg', 'Failed to load members: ' + err.message);
    res.redirect('/admin/dashboard');
  }
};

module.exports.users_get = async (req, res) => {
  try {
    await syncMissingMemberProfiles();
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const members = await Member.find().lean();
    const memberByUser = {};
    members.forEach((m) => {
      memberByUser[String(m.userId)] = m;
    });
    res.render('admin/users', { title: 'Registered Users', users, memberByUser });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/dashboard');
  }
};

module.exports.delete_user = async (req, res) => {
  let session;
  try {
    if (String(req.params.userId) === String(req.userJwt.id)) throw new Error('You cannot delete the account currently in use.');
    session = await mongoose.startSession();
    session.startTransaction();
    const user = await User.findById(req.params.userId).session(session);
    if (!user) throw new Error('User not found.');

    const member = await Member.findOne({ userId: user._id }).session(session);
    const trainer = await Trainer.findOne({ userId: user._id }).session(session);
    if (member) {
      await Attendance.deleteMany({ memberId: member._id }, { session });
      await Membership.deleteMany({ user: user._id }, { session });
      await Payment.deleteMany({ memberId: member._id }, { session });
      await Member.deleteOne({ _id: member._id }, { session });
    }
    if (trainer) {
      await Member.updateMany({ trainerId: trainer._id }, { $set: { trainerId: null } }, { session });
      await Trainer.deleteOne({ _id: trainer._id }, { session });
    }
    await User.deleteOne({ _id: user._id }, { session });
    await session.commitTransaction();
    session.endSession();
    await logAudit(req, { action: 'delete', entity: 'User', entityId: user._id, details: `${user.username} (${user.role})` });
    req.flash('success_msg', `User ${user.username} deleted.`);
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    req.flash('error_msg', err.message);
  }
  res.redirect('/admin/users');
};

module.exports.new_get = async (req, res) => {
  const plans = await Plan.find({ isActive: true }).lean();
  res.render('admin/memberForm', { title: 'Register Member', member: null, plans });
};

module.exports.create_post = async (req, res) => {
  const { error, value } = memberSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    req.flash('error_msg', error.details.map((d) => d.message).join(', '));
    return res.redirect('/admin/members/new');
  }
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const plan = await Plan.findById(value.planId).session(session);
    if (!plan || !plan.isActive) throw new Error('Selected plan does not exist or is inactive.');

    const validTill = new Date();
    validTill.setDate(validTill.getDate() + plan.durationDays);

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const nameParts = value.fullName.trim().split(/\s+/);
    const [newUser] = await User.create([{
      username: value.username,
      email: value.email,
      password: hashedPassword,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || nameParts[0],
      role: 'member',
    }], { session });

    const [created] = await Member.create([{
      userId: newUser._id,
      fullName: value.fullName,
      phone: value.phone,
      dob: value.dob,
      gender: value.gender,
      address: value.address,
      emergencyContactName: value.emergencyContactName,
      emergencyContactPhone: value.emergencyContactPhone,
      fitnessGoals: value.fitnessGoals,
      photoUrl: req.file ? `/uploads/members/${req.file.filename}` : undefined,
      planId: value.planId,
      validTill,
    }], { session });
    await session.commitTransaction();
    session.endSession();

    await logAudit(req, { action: 'create', entity: 'Member', entityId: created._id, details: value.fullName });
    req.flash('success_msg', `Member ${value.fullName} registered successfully.`);
    res.redirect('/admin/members');
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    req.flash('error_msg', err.message);
    res.redirect('/admin/members/new');
  }
};

module.exports.show_get = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate('planId').populate('trainerId').populate('userId').lean();
    if (!member) throw new Error('Member not found.');
    const plans = await Plan.find({ isActive: true }).lean();
    const trainers = await Trainer.find().lean();
    res.render('admin/memberShow', { title: 'Member Details', member, plans, trainers });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/members');
  }
};

module.exports.update_put = async (req, res) => {
  try {
    const { error, value } = memberUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) throw new Error(error.details.map((d) => d.message).join(', '));
    const { fullName, phone, address, gender, status, planId, trainerId, emergencyContactName, emergencyContactPhone, fitnessGoals } = value;
    const member = await Member.findById(req.params.id);
    if (!member) throw new Error('Member not found.');

    member.fullName = fullName || member.fullName;
    member.phone = phone || member.phone;
    member.address = address;
    member.emergencyContactName = emergencyContactName;
    member.emergencyContactPhone = emergencyContactPhone;
    member.fitnessGoals = fitnessGoals;
    member.gender = gender || member.gender;
    if (['active', 'expired', 'frozen'].includes(status)) member.status = status;
    if (planId) member.planId = planId;
    if (trainerId) {
      const trainer = await Trainer.findById(trainerId);
      if (!trainer) throw new Error('Selected trainer does not exist.');
      if (String(member.trainerId) !== String(trainer._id)) {
        const cap = Number(process.env.TRAINER_CAPACITY_CAP || 25);
        const load = await Member.countDocuments({ trainerId: trainer._id, status: 'active', _id: { $ne: member._id } });
        if (load >= cap && status === 'active') throw new Error(`Trainer is at capacity (${cap}). Assignment blocked.`);
      }
    }
    member.trainerId = trainerId || null;
    await member.save();

    await logAudit(req, { action: 'update', entity: 'Member', entityId: member._id, details: `status=${member.status}` });
    req.flash('success_msg', 'Member updated.');
    res.redirect(`/admin/members/${member._id}`);
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/members');
  }
};

module.exports.dashboard_get = async (req, res) => {
  const member = await Member.findOne({ userId: req.userJwt.id })
    .populate('planId')
    .populate('trainerId')
    .lean();
  const payments = member
    ? await Payment.find({ memberId: member._id }).populate('planId').sort({ paidOn: -1 }).lean()
    : [];
  const daysLeft = member && member.validTill
    ? Math.ceil((new Date(member.validTill) - new Date()) / 86400000)
    : null;
  res.render('member/dashboard', {
    title: 'My Dashboard',
    member,
    payments,
    daysLeft,
  });
};
