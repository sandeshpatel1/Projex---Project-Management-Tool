const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: verify project belongs to this user
const verifyProjectOwner = async (projectId, uid) => {
  const project = await Project.findOne({ _id: projectId, owner_uid: uid });
  return project;
};

// POST /api/projects/:project_id/tasks
const createTask = async (req, res, next) => {
  try {
    const project = await verifyProjectOwner(req.params.project_id, req.user.uid);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { title, description, status, priority, due_date, assignee, tags } = req.body;
    const task = await Task.create({
      project_id: req.params.project_id,
      title, description, status, priority,
      due_date: due_date || null,
      assignee, tags,
    });
    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (err) { next(err); }
};

// GET /api/projects/:project_id/tasks
const getTasksByProject = async (req, res, next) => {
  try {
    const project = await verifyProjectOwner(req.params.project_id, req.user.uid);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const page   = parseInt(req.query.page) || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const skip   = (page - 1) * limit;
    const filter = { project_id: req.params.project_id };

    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.search)   filter.title    = { $regex: req.query.search, $options: 'i' };

    const sortField   = req.query.sortBy || 'created_at';
    const sortOrder   = req.query.sortOrder === 'asc' ? 1 : -1;
    const allowedSort = ['due_date', 'created_at', 'priority', 'title', 'status'];
    const sort        = { [allowedSort.includes(sortField) ? sortField : 'created_at']: sortOrder };

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project_id', 'name color owner_uid');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    // Check ownership via project
    if (task.project_id.owner_uid !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project_id', 'owner_uid');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.project_id.owner_uid !== req.user.uid) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { title, description, status, priority, due_date, assignee, tags } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority, due_date, assignee, tags },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Task updated', data: updated });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project_id', 'owner_uid');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.project_id.owner_uid !== req.user.uid) return res.status(403).json({ success: false, message: 'Forbidden' });
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const task = await Task.findById(req.params.id).populate('project_id', 'owner_uid');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.project_id.owner_uid !== req.user.uid) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updated = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (err) { next(err); }
};

module.exports = { createTask, getTasksByProject, getTaskById, updateTask, deleteTask, updateTaskStatus };

// GET /api/tasks/due-soon  — tasks due in next 48h across all user projects
const getDueSoonTasks = async (req, res, next) => {
  try {
    const now     = new Date();
    const in48h   = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Get all project IDs owned by this user
    const Project = require('../models/Project');
    const projects = await Project.find({ owner_uid: req.user.uid }).select('_id');
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({
      project_id: { $in: projectIds },
      status:     { $ne: 'done' },
      due_date:   { $lte: in48h },
    }).sort({ due_date: 1 }).limit(20);

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

module.exports = { createTask, getTasksByProject, getTaskById, updateTask, deleteTask, updateTaskStatus, getDueSoonTasks };
