const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, default: '0000000000', match: [/^\d{10}$/, '10-digit number required'] },
  dob: { type: Date, default: Date.now },
  gender: { type: String, enum: ['M', 'F', 'O'], default: 'O' },
  address: { type: String },
  emergencyContactName: { type: String, default: '' },
  emergencyContactPhone: { type: String, default: '' },
  fitnessGoals: { type: String, default: '' },
  photoUrl: { type: String, default: '/img/logo.png' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
  joinDate: { type: Date, default: Date.now },
  validTill: { type: Date, required: true, index: true },
  status: { type: String, enum: ['active', 'expired', 'frozen'], default: 'active' },
});

module.exports = mongoose.model('Member', memberSchema);
