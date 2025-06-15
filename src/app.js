// import modules

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { corsOptions } from './config/corsOptions.js';
import { logRequestMiddleware } from './middleware/logger.js';


// routes import

import userRouter from './components/users/routes/index.js';
import taskRouter from './components/tasks/routes/index.js';
import projectRouter from './components/projects/routes/index.js';
import notificationRouter from './components/notifications/routes/index.js';
import stripeRouter from './components/stripe/routes/index.js'

// initiate app

const app = express();

// middlewares

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(logRequestMiddleware);

// routes decalaration
const apiRouter = express.Router();


apiRouter.use('/user', userRouter);
apiRouter.use('/task', taskRouter);
apiRouter.use('/project', projectRouter);
apiRouter.use('/notification', notificationRouter);
apiRouter.use('/stripe', stripeRouter);

app.use('/api', apiRouter); 

export { app };
