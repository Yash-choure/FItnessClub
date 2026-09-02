const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  durationDays: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  features: [String],
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Plan', planSchema);
