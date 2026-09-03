const nodemailer = require('nodemailer');
const Member = require('../models/Member');

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function syncExpiredMembers() {
  await Member.updateMany({ validTill: { $lt: new Date() }, status: 'active' }, { $set: { status: 'expired' } });
}

async function sendExpiryReminders() {
  await syncExpiredMembers();
  const transporter = getTransporter();
  if (!transporter) return 0;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  const members = await Member.find({ status: 'active', validTill: { $gte: now, $lte: end } }).populate('userId').lean();
  let sent = 0;
  for (const member of members) {
    if (!member.userId || !member.userId.email) continue;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: member.userId.email,
      subject: 'Your FitnessClub membership is expiring soon',
      text: `Hello ${member.fullName}, your membership expires on ${new Date(member.validTill).toLocaleDateString('en-IN')}. Please contact the gym to renew it.`,
    });
    sent += 1;
  }
  return sent;
}

module.exports = { syncExpiredMembers, sendExpiryReminders };
