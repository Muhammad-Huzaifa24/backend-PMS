const port = 3000 || process.env.PORT;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: process.env.ACCESS_TOKEN_EXPIRY,
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: process.env.REFRESH_TOKEN_EXPIRY,
};

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174','https://project-management-dashboard-ruddy.vercel.app'],
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export { port, cookieOptions, refreshCookieOptions, corsOptions };
