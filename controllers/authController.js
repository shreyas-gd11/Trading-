const { validationResult } = require('express-validator');
const authService = require('../services/authService');

const authController = {
  // POST /api/auth/signup
  async signup(req, res, next) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0]?.msg || 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, email, password } = req.body;

      // Create user
      const result = await authService.signup(name, email, password);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0]?.msg || 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Login user
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0]?.msg || 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0]?.msg || 'Validation failed',
          errors: errors.array()
        });
      }

      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;