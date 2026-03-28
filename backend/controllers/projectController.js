const Project = require('../models/Project');
const Task = require('../models/Task');

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description, color, status } = req.body;
    const project = await Project.create({
      owner_uid: req.user.uid,
      name, description, color, status,
    });
    res.status(201).json({ success: true, message: 'Project created successfully', data: project });
  } catch (err) { next(err); }
};

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const page      = parseInt(req.query.page) || 1;
    const limit     = parseInt(req.query.limit) || 10;
    const skip      = (page - 1) * limit;
    const search    = req.query.search || '';
    const status    = req.query.status || '';
    const sortBy    = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = { owner_uid: req.user.uid };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const [projects, total] = await Promise.all([
      Project.find(filter).populate('taskCount').sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner_uid: req.user.uid }).populate('taskCount');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const taskStats = await Task.aggregate([
      { $match: { project_id: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = { todo: 0, 'in-progress': 0, done: 0 };
    taskStats.forEach((s) => (stats[s._id] = s.count));

    res.json({ success: true, data: { ...project.toJSON(), taskStats: stats } });
  } catch (err) { next(err); }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { name, description, color, status } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner_uid: req.user.uid },
      { name, description, color, status },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project updated', data: project });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner_uid: req.user.uid });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Task.deleteMany({ project_id: req.params.id });
    await project.deleteOne();
    res.json({ success: true, message: 'Project and tasks deleted' });
  } catch (err) { next(err); }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };
