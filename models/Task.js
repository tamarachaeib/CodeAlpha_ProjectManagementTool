const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, default: null },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TaskComment' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
