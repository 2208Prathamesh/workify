const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, required: true },
  message:  { type: String, required: true },
  link:     { type: String, default: '' },
  is_read:  { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
