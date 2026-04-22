const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  name:       { type: String, required: true, trim: true },
  role:       { type: String, required: true, enum: ['seeker', 'employer', 'admin'] },
  verified:   { type: Boolean, default: false },
  avatar_url: { type: String, default: '' },
  lang_pref:  { type: String, default: 'auto', enum: ['auto', 'en', 'hi', 'mr'] },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
