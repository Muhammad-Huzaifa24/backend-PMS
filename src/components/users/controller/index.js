import {
  badRequestResponse,
  createdResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
  alreadyExistResponse,
} from '../../../utils/ApiResponse.js';

import { generateAccessAndRefereshTokens } from '../../../utils/generateTokens.js';

import User from '../model/index.js';

import { refreshCookieOptions } from '../../../constants.js';

import jwt from 'jsonwebtoken';

import logger from '../../../utils/logger.js';

const registerUser = async (req, res) => {
  const { email, name, password, role } = req.body;
  console.log('register user', req.body);
  if ([email, name, password, role].some((field) => field?.trim() === '')) {
    logger.warn('request data is incomplete');
    return badRequestResponse(res, 'All fields are required');
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(`User already exists: ${email}`);
      return alreadyExistResponse(res, 'User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    const createdUser = await User.findById(user._id).select(
      '-password -refreshToken'
    );

    if (!createdUser) {
      logger.error(`User not found after creation: ${email}`);
      return notFoundResponse(res, 'User not found');
    }

    logger.info(`User registered successfully: ${email}`);
    return createdResponse(res, 'User registered successfully', user);
  } catch (error) {
    logger.error(`Error while registering user: ${error.message}`);

    if (error.name === 'ValidationError') {
      return badRequestResponse(
        res,
        `Validation Error: ${Object.values(error.errors)
          .map((err) => err.message)
          .join(', ')}`
      );
    }

    return serverErrorResponse(res, 'Error while registering user');
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Login attempt with missing email or password');
    return badRequestResponse(res, 'Email and password are required');
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login attempt failed. User not found with email: ${email}`);
      return notFoundResponse(res, 'User not found');
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      logger.warn(
        `Login attempt failed. Invalid credentials for email: ${email}`
      );
      return badRequestResponse(res, 'Invalid credentials');
    }

    const { accessToken, refreshToken, expiresIn  } = await generateAccessAndRefereshTokens(
      user._id
    );

    // user.refreshToken = refreshToken;
    await user.save();

    const loggedInUser = await User.findById(user._id).select(
      '-password -refreshToken'
    );

    res.setHeader('Authorization', `Bearer ${accessToken}`);
    logger.info(`User logged in successfully: ${email}`);
    return successResponse(res, 'Login successful', {loggedInUser, expiresIn  });
  } catch (error) {
    logger.error(`Error while logging in: ${email} ${error.message}`);

    return serverErrorResponse(res, 'Error while logging in');
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'Manager' } }); // Query for users whose role is not "Manager"

    if (!users || users.length === 0) {
      logger.error('No users found');
      return notFoundResponse(
        res,
        'No users'
      );
    }

    logger.info('Users retrieved successfully');
    return successResponse(res, undefined, users);
  } catch (error) {
    logger.error('Error while getting users');
    return serverErrorResponse(res);
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) {
      logger.error('Invalid ID format');
      return badRequestResponse(res, 'Invalid user ID format');
    }

    const user = await User.findById(id);

    if (!user) {
      logger.error(`User not found with ID: ${id}`);
      return notFoundResponse(res, `User not found with ID: ${id}`);
    }

    logger.info(`User retrieved successfully with ID: ${id}`);
    return successResponse(res, undefined, user);
  } catch (error) {
    logger.error(`Error while getting user with ID: ${id}`);
    return serverErrorResponse(res);
  }
};

const logoutUser = async (req, res) => {
  if (!req.user) {
    logger.warn('no user found');
    return notFoundResponse(res, 'no user found');
  }
  const { id } = req.user._id;
  try {
    if (!id) {
      logger.warn('user id not provided');
      return badRequestResponse(res, 'user id not provided');
    }
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { refreshToken: undefined },
      },
      { new: true }
    );

    logger.info(`${req.user.name} logged out successfully`);
    return successResponse(res, 'Logged out sussfully');
  } catch (error) {
    logger.error('Error while logging out');
    return serverErrorResponse(res, 'Error while logging out');
  }
};

const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refresh_token;

  if (!incomingRefreshToken) {
    logger.error('refresh token is not provided');

    return notFoundResponse(res, 'refresh token not found');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      logger.error(`${user.name} not found`);

      return notFoundResponse(res, 'user not found');
    }
    if (user?.refreshToken !== incomingRefreshToken) {
      logger.error('invalid refresh token');

      return badRequestResponse(res, 'invalid refresh token');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    res.setHeader('Authorization', `Bearer ${accessToken}`);

    logger.info('Access token refreshed successfully');

    return successResponse(res, 'Access token refreshed', {
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Error while refreshing access token', error);
    serverErrorResponse(res, 'Error while refreshing access token');
  }
};

export {
  generateAccessAndRefereshTokens,
  registerUser,
  loginUser,
  getAllUsers,
  logoutUser,
  refreshAccessToken,
  getUser,
};
