const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation rules
const signupValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// POST /api/auth/signup
router.post('/signup', signupValidation, authController.signup);

// POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;