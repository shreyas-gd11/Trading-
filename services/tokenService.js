const axios = require('axios');
const User = require('../models/User');

class TokenService {
  constructor() {
    this.tokenCache = {};
    this.refreshIntervals = {};
  }

  /**
   * Save Upstox token for a user
   */
  async saveToken(userId, accessToken, expiresIn = 86400) {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      
      await User.findByIdAndUpdate(
        userId,
        {
          upstoxToken: accessToken,
          upstoxTokenExpiresAt: expiresAt,
          upstoxTokenStatus: 'active'
        },
        { new: true }
      );

      this.tokenCache[userId] = {
        token: accessToken,
        expiresAt,
        status: 'active'
      };

      console.log(`✓ Token saved for user ${userId}. Expires at ${expiresAt}`);
      return { success: true, expiresAt };
    } catch (error) {
      console.error('Error saving token:', error.message);
      throw error;
    }
  }

  /**
   * Get token for a user from cache or database
   */
  async getToken(userId) {
    try {
      // Check cache first
      if (this.tokenCache[userId]) {
        const cached = this.tokenCache[userId];
        if (new Date() < cached.expiresAt) {
          return cached.token;
        }
      }

      // Fetch from database
      const user = await User.findById(userId);
      if (!user || !user.upstoxToken) {
        return null;
      }

      // Check if expired
      if (user.upstoxTokenExpiresAt && new Date() > user.upstoxTokenExpiresAt) {
        await this.markTokenAsExpired(userId);
        return null;
      }

      // Cache it
      this.tokenCache[userId] = {
        token: user.upstoxToken,
        expiresAt: user.upstoxTokenExpiresAt,
        status: user.upstoxTokenStatus || 'active'
      };

      return user.upstoxToken;
    } catch (error) {
      console.error('Error retrieving token:', error.message);
      return null;
    }
  }

  /**
   * Get token status for a user
   */
  async getTokenStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { status: 'not-found', message: 'User not found' };
      }

      if (!user.upstoxToken) {
        return { status: 'missing', message: 'No token found' };
      }

      const now = new Date();
      const expiresAt = user.upstoxTokenExpiresAt;

      if (expiresAt && now > expiresAt) {
        return {
          status: 'expired',
          message: 'Token expired',
          expiredAt: expiresAt,
          secondsAgo: Math.floor((now - expiresAt) / 1000)
        };
      }

      const timeToExpiry = expiresAt ? expiresAt - now : null;
      const hoursRemaining = timeToExpiry ? Math.floor(timeToExpiry / 3600000) : null;

      return {
        status: 'active',
        message: 'Token is valid',
        expiresAt,
        secondsRemaining: timeToExpiry ? Math.floor(timeToExpiry / 1000) : null,
        hoursRemaining,
        tokenStatus: user.upstoxTokenStatus || 'active'
      };
    } catch (error) {
      console.error('Error checking token status:', error.message);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Mark token as expired
   */
  async markTokenAsExpired(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        upstoxTokenStatus: 'expired'
      });

      if (this.tokenCache[userId]) {
        this.tokenCache[userId].status = 'expired';
      }

      console.log(`⚠ Token marked as expired for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error marking token as expired:', error.message);
      return false;
    }
  }

  /**
   * Background check every 30 minutes
   */
  startBackgroundCheck(userId, checkInterval = 30 * 60 * 1000) {
    // Clear existing interval if any
    if (this.refreshIntervals[userId]) {
      clearInterval(this.refreshIntervals[userId]);
    }

    this.refreshIntervals[userId] = setInterval(async () => {
      const status = await this.getTokenStatus(userId);
      if (status.status === 'expired') {
        console.log(`⚠ [Background Check] Token for user ${userId} needs refresh`);
      } else if (status.status === 'active' && status.hoursRemaining) {
        console.log(`✓ [Background Check] Token for user ${userId} still valid (${status.hoursRemaining}h remaining)`);
      }
    }, checkInterval);

    console.log(`✓ Background check started for user ${userId} (interval: ${checkInterval}ms)`);
  }

  /**
   * Stop background check
   */
  stopBackgroundCheck(userId) {
    if (this.refreshIntervals[userId]) {
      clearInterval(this.refreshIntervals[userId]);
      delete this.refreshIntervals[userId];
      console.log(`✓ Background check stopped for user ${userId}`);
    }
  }

  /**
   * Clear cache for a user
   */
  clearCache(userId) {
    delete this.tokenCache[userId];
  }

  /**
   * Clear all caches
   */
  clearAllCache() {
    this.tokenCache = {};
  }
}

module.exports = new TokenService();
