import { Router } from 'express';
import {
  stripePayment
} from '../controller/index.js';
// import { verifyJWT } from '../../../middleware/auth.js';

const router = Router();

router.post('/create-payment-intent', stripePayment);

export default router;
