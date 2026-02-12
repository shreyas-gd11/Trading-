const axios = require('axios');
const tokenService = require('../services/tokenService');
const User = require('../models/User');

/**
 * Save token received from OAuth callback
 * POST /api/auth/token/save
 * Body: { userId, accessToken, expiresIn }
 */
exports.saveToken = async (req, res) => {
  try {
    const { userId, accessToken, expiresIn } = req.body;

    if (!userId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or accessToken'
      });
    }

    const result = await tokenService.saveToken(userId, accessToken, expiresIn || 86400);

    // Start background check for this user
    tokenService.startBackgroundCheck(userId);

    res.json({
      success: true,
      message: 'Token saved successfully',
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Error in saveToken:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save token',
      error: error.message
    });
  }
};

/**
 * Get token status
 * GET /api/auth/token/status?userId=xxx
 */
exports.getTokenStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId query parameter is required'
      });
    }

    const status = await tokenService.getTokenStatus(userId);

    // Transform status for UI
    let badgeStatus = 'error';
    let badgeColor = 'red';

    if (status.status === 'active') {
      badgeStatus = 'active';
      badgeColor = 'green';
    } else if (status.status === 'expired') {
      badgeStatus = 'expired';
      badgeColor = 'red';
    } else if (status.status === 'missing') {
      badgeStatus = 'missing';
      badgeColor = 'yellow';
    }

    res.json({
      success: true,
      ...status,
      badgeStatus,
      badgeColor,
      actionRequired: status.status !== 'active'
    });
  } catch (error) {
    console.error('Error in getTokenStatus:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get token status',
      error: error.message
    });
  }
};

/**
 * Initiate token refresh (one-click re-authentication)
 * POST /api/auth/token/refresh
 * Body: { userId }
 */
exports.initiateRefresh = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Clear the cached token to force re-authentication
    tokenService.clearCache(userId);

    // Mark token as needing refresh
    await User.findByIdAndUpdate(userId, {
      upstoxTokenStatus: 'invalid'
    });

    // Generate OAuth URL for user to authenticate
    const oauthUrl = `https://api.upstox.com/v2/login/authorization/dialog?client_id=${process.env.UPSTOX_API_KEY}&redirect_uri=${encodeURIComponent('http://localhost:5000/callback')}&response_type=code&state=${userId}`;

    res.json({
      success: true,
      message: 'Token refresh initiated',
      oauthUrl,
      instruction: 'Please visit the OAuth URL to re-authenticate'
    });
  } catch (error) {
    console.error('Error in initiateRefresh:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate token refresh',
      error: error.message
    });
  }
};

/**
 * Verify token validity with Upstox API
 * GET /api/auth/token/verify?token=xxx
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'token query parameter is required'
      });
    }

    const response = await axios.get(
      'https://api.upstox.com/v2/user/profile',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json({
      success: true,
      message: 'Token is valid',
      profile: response.data.data
    });
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.status === 401
      ? 'Token is invalid or expired'
      : error.message;

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.response?.data?.message || error.message
    });
  }
};
