import { Router } from 'express';
import { 
    getNotificationsByUserId, 
    updateNotificationStatus 
} from '../controllers/index.js';
import { verifyJWT } from '../../../middleware/auth.js';

const router = Router();

router.get('/:id', verifyJWT, getNotificationsByUserId);
router.post('/:id', verifyJWT, updateNotificationStatus);

export default router;
