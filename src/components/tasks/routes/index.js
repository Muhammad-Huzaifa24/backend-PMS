import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  getTask,
} from '../controller/index.js';
import { verifyJWT } from '../../../middleware/auth.js';

const router = Router();

router.get('/', verifyJWT, getTasks); // GET /tasks
router.get('/:id', verifyJWT, getTask); // GET /tasks/:id
router.post('/', verifyJWT, createTask); // POST /tasks
router.put('/:id', verifyJWT, updateTask); // PATCH /tasks/:id
router.delete('/:id', verifyJWT, deleteTask); // DELETE /tasks/:id

export default router;
