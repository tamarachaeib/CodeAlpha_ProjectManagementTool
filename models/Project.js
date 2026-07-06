const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, default: '', maxlength: 300 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // بما فيهم الـ owner
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);
