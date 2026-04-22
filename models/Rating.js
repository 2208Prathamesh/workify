const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  seeker_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  stars:       { type: Number, required: true, min: 1, max: 5 },
  review:      { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

ratingSchema.index({ seeker_id: 1, employer_id: 1, job_id: 1 }, { unique: true });

module.exports = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
