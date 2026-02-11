const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('./emailService');

const authService = {
  // Signup new user
  async signup(name, email, password) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Email already registered');
      error.status = 400;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      await user.save();
      console.log(`[Auth] ✓ New user SAVED to DB: ${email}`);
      console.log(`[Auth] User ID: ${user._id}`);
      console.log(`[Auth] Database: stockproject, Collection: users`);
    } catch (saveError) {
      console.error(`[Auth] ✗ Failed to save user: ${saveError.message}`);
      throw saveError;
    }

    // Send welcome email (non-blocking)
    try {
      emailService.sendWelcomeEmail(user).catch(err => 
        console.error('[Email] Failed to send welcome email:', err.message)
      );
    } catch (err) {
      console.error('[Email] Error sending welcome email:', err.message);
    }

    // Generate token
    const token = this.generateToken(user._id);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    };
  },

  // Login user
  async login(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        const error = new Error('Email and password are required');
        error.status = 400;
        throw error;
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }

      // Verify password - handle both passwordHash and password fields
      const storedPassword = user.passwordHash || user.password;
      if (!storedPassword) {
        console.error(`[Auth Error] User ${email} has no password field set`);
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }

      const isMatch = await bcrypt.compare(password, storedPassword);
      if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
      }

      // Generate token
      const token = this.generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Generate JWT token
  generateToken(userId) {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    return jwt.sign(
      { userId },
      secret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  },

  // Send forgot password email
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User with this email not found');
      error.status = 404;
      throw error;
    }

    await emailService.sendPasswordResetEmail(user);
    return { success: true, message: 'Password reset email sent successfully' };
  },

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        const error = new Error('Token and password are required');
        error.status = 400;
        throw error;
      }

      const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(token, secret);

      const user = await User.findById(decoded.userId);
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      // Validate password
      if (newPassword.length < 6) {
        const error = new Error('Password must be at least 6 characters');
        error.status = 400;
        throw error;
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
      await user.save();

      console.log(`[Auth] Password reset for user: ${user.email}`);
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const err = new Error('Reset link has expired. Please request a new one.');
        err.status = 400;
        throw err;
      }
      if (error.name === 'JsonWebTokenError') {
        const err = new Error('Invalid reset link');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }
};

module.exports = authService;