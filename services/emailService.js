const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Setup transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailService = {
  // Send password reset email
  async sendPasswordResetEmail(user) {
    try {
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '1h' }
      );

      // Create reset link
      const resetLink = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password.html?token=${resetToken}`;

      // LOG TO CONSOLE INSTEAD OF EMAIL
      console.log('\n========== PASSWORD RESET REQUEST ==========');
      console.log(`Email: ${user.email}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log('==========================================\n');

      return { success: true, message: 'Password reset token generated (check console)' };
    } catch (error) {
      console.error('[Email Error]:', error.message);
      const err = new Error('Failed to generate password reset token');
      err.status = 500;
      throw err;
    }
  },

  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      console.log('\n========== WELCOME EMAIL ==========');
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log('User successfully registered in database');
      console.log('===================================\n');
      
      // Non-critical, just log
      return { success: true };
    } catch (error) {
      console.error('[Email Error]:', error.message);
      // Don't throw - welcome email is not critical
      return { success: false };
    }
  }
};

module.exports = emailService;
