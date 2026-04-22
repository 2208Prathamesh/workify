const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills:              { type: String, default: '' },
  location:            { type: String, default: '' },
  availability:        { type: String, default: 'Full-time' },
  contact_phone:       { type: String, default: '' },
  bio:                 { type: String, default: '' },
  experience:          { type: String, default: '' },
  languages:           { type: String, default: '' },
  daily_rate:          { type: String, default: '' },
  work_type:           { type: String, default: 'Any' },
  availability_status: { type: String, default: 'looking' },
  whatsapp:            { type: String, default: '' },
  portfolio:           { type: [mongoose.Schema.Types.Mixed], default: [] },
});

module.exports = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
