const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createProject, getProjects, getProjectById, updateProject, deleteProject } = require('../controllers/projectController');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const projectValidation = [
  body('name').notEmpty().withMessage('Project name is required').isLength({ max: 100 }).withMessage('Max 100 chars'),
  body('description').optional().isLength({ max: 500 }).withMessage('Max 500 chars'),
  body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
];

// All project routes are protected
router.use(protect);
router.post('/', projectValidation, validate, createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', projectValidation, validate, updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
