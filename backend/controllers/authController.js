// controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const Client = require('../models/Client');
const constants = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { sendEmail } = require('../config/email');
const emailTemplates = require('../utils/emailTemplates');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: constants.ROLES.USER,
  });

  // Automatically create Client document for USER role to avoid mapping errors later
  await Client.create({
    userId: user._id,
    name: user.name,
    companyName: `${user.name}'s Group`,
    email: user.email,
    phone: user.phone,
    status: constants.CLIENT_STATUS.ACTIVE
  });
  const token = generateToken(user._id, user.role);
  setTokenCookie(res, token);

  res.status(201).json(
    new ApiResponse(201, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        onboardingTasks: user.onboardingTasks,
      },
      message: 'User registered successfully'
    })
  );
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate token with userId and role
  const token = generateToken(user._id, user.role);
  setTokenCookie(res, token);

  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        onboardingTasks: user.onboardingTasks,
      },
      message: 'Login successful'
    })
  );
});

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);

  res.status(200).json(
    new ApiResponse(200, 'Logout successful')
  );
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        phone: user.phone,
        onboardingTasks: user.onboardingTasks,
      }
    })
  );
});


/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        onboardingTasks: user.onboardingTasks,
      },
      message: 'Profile updated successfully'
    })
  );
});

/**
 * @desc    Forgot password - Send reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Please provide an email address');
  }

  const user = await User.findOne({ email });

  if (!user) {
    // For security, don't reveal that the user doesn't exist
    return res.status(200).json(
      new ApiResponse(200, 'If a user with that email exists, a reset link has been sent.')
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expire (1 hour)
  user.resetPasswordExpires = Date.now() + 3600000;

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Send email
  const template = emailTemplates.passwordResetEmail(user.name, resetUrl);
  await sendEmail({
    to: user.email,
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent
  });

  res.status(200).json(
    new ApiResponse(200, 'Password reset email sent successfully.')
  );
});

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) {
    throw new ApiError(400, 'Please provide a new password');
  }

  // Hash token to compare with DB
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  // Set new password (pre-save hook will hash it)
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json(
    new ApiResponse(200, 'Password reset successful. You can now login with your new password.')
  );
});

/**
 * @desc    Update onboarding task status
 * @route   PATCH /api/auth/onboarding/:task
 * @access  Private
 */
exports.updateOnboardingTask = asyncHandler(async (req, res) => {
  const { task } = req.params;
  const { completed } = req.body;

  const validTasks = Object.values(constants.ONBOARDING_TASKS);
  if (!validTasks.includes(task)) {
    throw new ApiError(400, 'Invalid onboarding task');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.onboardingTasks) {
    user.onboardingTasks = {};
  }

  user.onboardingTasks[task] = typeof completed === 'boolean' ? completed : true;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      onboardingTasks: user.onboardingTasks,
      message: 'Onboarding task updated'
    })
  );
});


