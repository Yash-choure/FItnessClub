const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  amount: { type: Number, required: true, min: 0 },
  mode: { type: String, enum: ['cash', 'upi', 'card', 'online'], required: true },
  paidOn: { type: Date, default: Date.now },
  receiptNo: { type: String, required: true, unique: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

paymentSchema.index({ memberId: 1, paidOn: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
