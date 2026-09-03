const bcrypt = require('bcrypt');
const Trainer = require('../models/Trainer');
const User = require('../models/user');
const Member = require('../models/Member');
const { trainerSchema, trainerUpdateSchema } = require('../utils/validators');
const { logAudit } = require('../utils/auditLog');

module.exports.list_get = async (req, res) => {
  const trainers = await Trainer.find().lean();
  const cap = Number(process.env.TRAINER_CAPACITY_CAP || 25);
  const withLoad = await Promise.all(
    trainers.map(async (t) => {
      const load = await Member.countDocuments({ trainerId: t._id, status: 'active' });
      return { ...t, load, cap };
    })
  );
  const members = await Member.find({ status: 'active' }).lean();
  res.render('admin/trainers', { title: 'Trainers', trainers: withLoad, members });
};

module.exports.create_post = async (req, res) => {
  const { error, value } = trainerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    req.flash('error_msg', error.details.map((d) => d.message).join(', '));
    return res.redirect('/admin/trainers');
  }
  try {
    const hashedPassword = await bcrypt.hash(value.password, 10);
    const nameParts = value.fullName.trim().split(/\s+/);
    const user = await User.create({
      username: value.username,
      email: value.email,
      password: hashedPassword,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || nameParts[0],
      role: 'trainer',
    });
    await Trainer.create({
      userId: user._id,
      fullName: value.fullName,
      phone: value.phone,
      speciality: value.speciality || 'strength',
      shift: value.shift,
      certification: value.certification,
    });
    await logAudit(req, { action: 'create', entity: 'Trainer', entityId: user._id, details: value.fullName });
    req.flash('success_msg', 'Trainer created.');
    res.redirect('/admin/trainers');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trainers');
  }
};

module.exports.assign_post = async (req, res) => {
  try {
    const cap = Number(process.env.TRAINER_CAPACITY_CAP || 25);
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) throw new Error('Trainer not found.');
    const member = await Member.findById(req.params.memberId);
    if (!member) throw new Error('Member not found.');
    if (String(member.trainerId) === String(trainer._id)) {
      req.flash('success_msg', 'Member is already assigned to this trainer.');
      return res.redirect('/admin/trainers');
    }
    const load = await Member.countDocuments({ trainerId: trainer._id, status: 'active' });
    if (load >= cap) {
      req.flash('error_msg', `Trainer is at capacity (${cap}). Assignment blocked.`);
      return res.redirect('/admin/trainers');
    }
    member.trainerId = req.params.id;
    await member.save();
    await logAudit(req, {
      action: 'assign',
      entity: 'Trainer',
      entityId: req.params.id,
      details: `member=${req.params.memberId}`,
    });
    req.flash('success_msg', 'Trainer assigned.');
    res.redirect('/admin/trainers');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trainers');
  }
};

module.exports.edit_get = async (req, res) => {
  const trainer = await Trainer.findById(req.params.id).lean();
  if (!trainer) {
    req.flash('error_msg', 'Trainer not found.');
    return res.redirect('/admin/trainers');
  }
  res.render('admin/trainerForm', { title: 'Edit Trainer', trainer });
};

module.exports.update_put = async (req, res) => {
  const { error, value } = trainerUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    req.flash('error_msg', error.details.map((d) => d.message).join(', '));
    return res.redirect(`/admin/trainers/${req.params.id}/edit`);
  }
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) throw new Error('Trainer not found.');
    trainer.fullName = value.fullName;
    trainer.phone = value.phone;
    trainer.speciality = value.speciality || trainer.speciality;
    trainer.shift = value.shift;
    trainer.certification = value.certification;
    await trainer.save();
    await logAudit(req, { action: 'update', entity: 'Trainer', entityId: trainer._id, details: trainer.fullName });
    req.flash('success_msg', 'Trainer updated.');
    res.redirect('/admin/trainers');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trainers');
  }
};

module.exports.dashboard_get = async (req, res) => {
  const trainer = await Trainer.findOne({ userId: req.userJwt.id }).lean();
  const members = trainer
    ? await Member.find({ trainerId: trainer._id }).populate('planId').sort({ fullName: 1 }).lean()
    : [];
  res.render('trainer/dashboard', {
    title: 'Trainer Dashboard',
    trainer,
    members,
  });
};
