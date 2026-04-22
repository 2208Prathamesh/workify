const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  content:  { type: String, required: true },
  is_read:  { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
