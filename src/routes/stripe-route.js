import { Router } from 'express';
import Stripe from 'stripe';
import dotenv from "dotenv"
import {successResponse, serverErrorResponse} from "../utils/ApiResponse.js"

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    console.log('req.body', req.body)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
    });

    return successResponse(res, 'Success', { clientSecret: paymentIntent.client_secret } )
    // res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return serverErrorResponse(res, error.message )
    // res.status(500).json({ error: error.message });
  }
});

export default router;
