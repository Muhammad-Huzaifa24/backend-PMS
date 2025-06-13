import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  getProject,
  getProjectTasks,
} from '../controller/index.js';
import { verifyJWT } from '../../../middleware/auth.js';

const router = Router();

router.get('/', verifyJWT, getProjects); // Get all projects
router.get('/:id', verifyJWT, getProject); // Get a specific project
router.get('/:id/tasks', verifyJWT, getProjectTasks); // Get tasks for a specific project

router.post('/', verifyJWT, createProject); // Create a new project

router.put('/:id', verifyJWT, updateProject); // Update a project

router.delete('/:id', deleteProject); // Delete a project

export default router;
