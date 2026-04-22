const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  seeker_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:         {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'cancel_requested', 'cancelled'],
  },
  decline_reason: { type: String, default: '' },
  cancel_reason:  { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

applicationSchema.index({ job_id: 1, seeker_id: 1 }, { unique: true });

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);
