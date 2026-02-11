const bcrypt = require('bcryptjs');
const User = require('../models/User');

const userService = {
  // Get user profile
  async getProfile(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      strategySettings: user.strategySettings,
      alertsCount: user.alerts.length,
      createdAt: user.createdAt
    };
  },

  // Update profile
  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Update name if provided
    if (updateData.name) {
      user.name = updateData.name;
    }

    // Update phone if provided
    if (updateData.phone) {
      user.phone = updateData.phone;
    }

    // Update profile picture if provided
    if (updateData.profilePicture) {
      user.profilePicture = updateData.profilePicture;
    }

    // Update password if provided
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(updateData.password, salt);
    }

    user.updatedAt = new Date();
    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture
    };
  },

  // Update strategy settings
  async updateStrategySettings(userId, settings) {
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Update only provided fields
    if (settings.ema20Period !== undefined) {
      user.strategySettings.ema20Period = settings.ema20Period;
    }
    if (settings.ema50Period !== undefined) {
      user.strategySettings.ema50Period = settings.ema50Period;
    }
    if (settings.rsiPeriod !== undefined) {
      user.strategySettings.rsiPeriod = settings.rsiPeriod;
    }
    if (settings.vixThreshold !== undefined) {
      user.strategySettings.vixThreshold = settings.vixThreshold;
    }
    if (settings.rsiThreshold !== undefined) {
      user.strategySettings.rsiThreshold = settings.rsiThreshold;
    }

    await user.save();

    return user.strategySettings;
  },

  // Create alert
  async createAlert(userId, alertData) {
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    user.alerts.push(alertData);
    await user.save();

    return user.alerts[user.alerts.length - 1];
  },

  // Get user alerts
  async getAlerts(userId) {
    const user = await User.findById(userId).select('alerts');
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    return user.alerts;
  },

  // Delete alert
  async deleteAlert(userId, alertId) {
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const alertIndex = user.alerts.findIndex(
      alert => alert._id.toString() === alertId
    );

    if (alertIndex === -1) {
      const error = new Error('Alert not found');
      error.status = 404;
      throw error;
    }

    user.alerts.splice(alertIndex, 1);
    await user.save();

    return true;
  }
};

module.exports = userService;