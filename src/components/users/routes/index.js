import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getAllUsers,
  logoutUser,
  refreshAccessToken,
  getUser,
} from '../controller/index.js';
import { verifyJWT } from '../../../middleware/auth.js';

const router = Router();

router.post('/login', loginUser);
router.post('/logout', verifyJWT, logoutUser);
router.post('/register', registerUser);
router.post('/refresh-token', refreshAccessToken);

router.get('/', getAllUsers);
router.get('/:id', getUser);

export default router;
