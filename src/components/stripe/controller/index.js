import {successResponse, serverErrorResponse, badRequestResponse} from "../../../utils/ApiResponse.js"
import Stripe from 'stripe';
import dotenv from "dotenv"

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const stripePayment = async (req, res) => {
  
   try {
    const { amount, currency } = req.body;
    
    if (!amount || !currency) {
      return badRequestResponse(res, 'Amount and currency are required')
    }
    console.log(req.body)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true }, // Enable auto methods
    });

    return successResponse(res, 'Success', { clientSecret: paymentIntent.client_secret } )
  } catch (error) {
    return serverErrorResponse(res, error.message )
  }
};
export { stripePayment }