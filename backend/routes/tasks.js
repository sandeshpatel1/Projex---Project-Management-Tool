const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createTask, getTasksByProject, getTaskById,
  updateTask, deleteTask, updateTaskStatus, getDueSoonTasks,
} = require('../controllers/taskController');
const { validate }  = require('../middleware/validate');
const { protect }   = require('../middleware/auth');

const taskValidation = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('due_date').optional({ nullable: true }).isISO8601().withMessage('Invalid date'),
];

const updateValidation = [
  body('title').optional().notEmpty().isLength({ max: 200 }),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional({ nullable: true }).isISO8601(),
];

router.use(protect);

// Due-soon route BEFORE :id routes to avoid param collision
router.get('/tasks/due-soon', getDueSoonTasks);

router.post('/projects/:project_id/tasks', taskValidation, validate, createTask);
router.get('/projects/:project_id/tasks', getTasksByProject);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', updateValidation, validate, updateTask);
router.delete('/tasks/:id', deleteTask);
router.patch('/tasks/:id/status', updateTaskStatus);

module.exports = router;
