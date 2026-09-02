const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  speciality: { type: String, default: 'strength' },
  shift: { type: String, enum: ['morning', 'evening', 'both'], default: 'both' },
  certification: { type: String },
});

module.exports = mongoose.model('Trainer', trainerSchema);
