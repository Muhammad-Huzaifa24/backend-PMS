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


export { port, cookieOptions, refreshCookieOptions };
