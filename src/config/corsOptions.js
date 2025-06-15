// config/corsOptions.js
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://project-management-dashboard-ruddy.vercel.app'
  ],
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;
