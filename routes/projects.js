const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route  GET /api/projects  -> كل المشاريع يلي أنا عضو فيها
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ members: req.userId })
      .sort({ updatedAt: -1 })
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar');

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/projects  -> إنشاء مشروع جديد
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const project = await Project.create({
      name,
      description: description || '',
      owner: req.userId,
      members: [req.userId], // صاحب المشروع عضو فيه أوتوماتيك
    });

    const populated = await project.populate('owner members', 'username avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  GET /api/projects/:id  -> تفاصيل مشروع + كل الـ tasks تبعو
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.members.some((m) => m._id.toString() === req.userId)) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'username avatar')
      .populate('createdBy', 'username avatar')
      .sort({ createdAt: 1 });

    res.json({ project, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/projects/:id/members  -> إضافة عضو (باستخدام username)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { username } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the project owner can add members' });
    }

    const userToAdd = await User.findOne({ username });
    if (!userToAdd) return res.status(404).json({ message: `User "${username}" not found` });

    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push(userToAdd._id);
    await project.save();

    await Notification.create({
      recipient: userToAdd._id,
      sender: req.userId,
      type: 'added-to-project',
      project: project._id,
    });

    const populated = await project.populate('owner members', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  DELETE /api/projects/:id  -> حذف مشروع (بس صاحبو)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the project owner can delete this project' });
    }

    const tasks = await Task.find({ project: project._id });
    const taskIds = tasks.map((t) => t._id);

    await TaskComment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
