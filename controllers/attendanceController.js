const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

function dayStart(value) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function visibleMembers(req) {
  const Trainer = require('../models/Trainer');
  const filter = req.userJwt.role === 'trainer'
    ? { trainerId: (await Trainer.findOne({ userId: req.userJwt.id }))?._id || null, status: 'active' }
    : { status: { $ne: 'expired' } };
  return Member.find(filter).sort({ fullName: 1 }).lean();
}

module.exports.list_get = async (req, res) => {
  const date = dayStart(req.query.date);
  const members = await visibleMembers(req);
  const records = await Attendance.find({ date }).lean();
  const byMember = Object.fromEntries(records.map((record) => [String(record.memberId), record.status]));
  res.render('attendance', { title: 'Daily Attendance', members, byMember, date: date.toISOString().slice(0, 10), role: req.userJwt.role });
};

module.exports.mark_post = async (req, res) => {
  const date = dayStart(req.body.date);
  const member = await Member.findById(req.body.memberId).lean();
  const Trainer = require('../models/Trainer');
  const trainer = req.userJwt.role === 'trainer' ? await Trainer.findOne({ userId: req.userJwt.id }) : null;
  if (!member || !['present', 'absent'].includes(req.body.status) || (req.userJwt.role === 'trainer' && (!trainer || String(member.trainerId) !== String(trainer._id)))) {
    req.flash('error_msg', 'You cannot mark attendance for this member.');
    return res.redirect(`/attendance?date=${req.body.date}`);
  }
  await Attendance.findOneAndUpdate(
    { memberId: member._id, date },
    { memberId: member._id, date, status: req.body.status, markedBy: req.userJwt.id },
    { upsert: true, new: true, runValidators: true }
  );
  req.flash('success_msg', `Attendance marked ${req.body.status}.`);
  res.redirect(`/attendance?date=${req.body.date}`);
};

module.exports.member_get = async (req, res) => {
  const member = await Member.findOne({ userId: req.userJwt.id }).lean();
  const records = member ? await Attendance.find({ memberId: member._id }).sort({ date: -1 }).limit(60).lean() : [];
  res.render('member/attendance', { title: 'My Attendance', member, records });
};
