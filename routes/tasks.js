const express = require('express');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// دالة صغيرة بنستخدمها بكذا مكان: تتأكد إنو اليوزر عضو بالمشروع تبع هالـ task
async function ensureProjectMember(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (!project.members.some((m) => m.toString() === userId)) return false;
  return project;
}

// @route  POST /api/tasks  -> إنشاء task جديدة بمشروع معيّن
router.post('/', auth, async (req, res) => {
  try {
    const { projectId, title, description, assignedTo, dueDate } = req.body;
    if (!projectId || !title) {
      return res.status(400).json({ message: 'projectId and title are required' });
    }

    const project = await ensureProjectMember(projectId, req.userId);
    if (project === null) return res.status(404).json({ message: 'Project not found' });
    if (project === false) return res.status(403).json({ message: 'You are not a member of this project' });

    const task = await Task.create({
      project: projectId,
      title,
      description: description || '',
      assignedTo: assignedTo || null,
      createdBy: req.userId,
      dueDate: dueDate || null,
    });

    if (assignedTo && assignedTo !== req.userId) {
      await Notification.create({
        recipient: assignedTo,
        sender: req.userId,
        type: 'assigned',
        project: projectId,
        task: task._id,
      });
    }

    const populated = await task.populate('assignedTo createdBy', 'username avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/tasks/:id  -> تعديل task (النص، الحالة/العمود، مين مكلّف فيها، تاريخ التسليم)
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await ensureProjectMember(task.project, req.userId);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    const { title, description, status, assignedTo, dueDate } = req.body;
    const wasAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

    await task.save();

    // إشعار بس إذا تغيّر شخص التكليف لشخص جديد (مش أنا)
    if (assignedTo && assignedTo !== wasAssignedTo && assignedTo !== req.userId) {
      await Notification.create({
        recipient: assignedTo,
        sender: req.userId,
        type: 'assigned',
        project: task.project,
        task: task._id,
      });
    }

    const populated = await task.populate('assignedTo createdBy', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await ensureProjectMember(task.project, req.userId);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    await TaskComment.deleteMany({ task: task._id });
    await task.deleteOne();

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/tasks/:id/comments  -> إضافة تعليق على task
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Comment content is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await ensureProjectMember(task.project, req.userId);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    const comment = await TaskComment.create({ task: task._id, author: req.userId, content });
    task.comments.push(comment._id);
    await task.save();

    // إشعار للشخص المكلّف بالـ task (إذا مش هو يلي علّق)
    if (task.assignedTo && task.assignedTo.toString() !== req.userId) {
      await Notification.create({
        recipient: task.assignedTo,
        sender: req.userId,
        type: 'comment',
        project: task.project,
        task: task._id,
      });
    }

    const populated = await comment.populate('author', 'username avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/tasks/:id/comments
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await ensureProjectMember(task.project, req.userId);
    if (!member) return res.status(403).json({ message: 'You are not a member of this project' });

    const comments = await TaskComment.find({ task: task._id })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatar');

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
