const mongoose = require('mongoose');

// Singleton SMTP settings document (only one document ever exists)
const smtpSchema = new mongoose.Schema({
  host:         { type: String, default: '' },
  port:         { type: Number, default: 587 },
  username:     { type: String, default: '' },
  password:     { type: String, default: '' },
  sender_name:  { type: String, default: 'Workify' },
  sender_email: { type: String, default: '' },
  secure:       { type: Boolean, default: false },
});

module.exports = mongoose.models.SmtpSettings || mongoose.model('SmtpSettings', smtpSchema);
