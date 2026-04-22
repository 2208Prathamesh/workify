const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employer_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:               { type: String, required: true, trim: true },
  description:         { type: String, required: true },
  skills_required:     { type: String, default: '' },
  duration:            { type: String, default: '' },
  salary:              { type: String, default: '' },
  location:            { type: String, default: '' },
  food_included:       { type: Boolean, default: false },
  transport_included:  { type: Boolean, default: false },
  status:              { type: String, default: 'active', enum: ['active', 'closed', 'removed'] },
  category:            { type: String, default: 'General' },
  pay_type:            { type: String, default: 'negotiable' },
  urgency:             { type: String, default: 'normal' },
  workers_needed:      { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
