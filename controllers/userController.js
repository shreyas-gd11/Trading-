const userService = require('../services/userService');

const userController = {
  // GET /api/user/profile
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user._id);

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/user/profile
  async updateProfile(req, res, next) {
    try {
      const { name, phone, password, profilePicture } = req.body;
      
      const updatedUser = await userService.updateProfile(
        req.user._id,
        { name, phone, password, profilePicture }
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/user/strategy-settings
  async updateStrategySettings(req, res, next) {
    try {
      const settings = await userService.updateStrategySettings(
        req.user._id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Strategy settings updated',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/user/alerts
  async createAlert(req, res, next) {
    try {
      const { symbol, condition, value } = req.body;

      if (!symbol || !condition || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'symbol, condition, and value are required'
        });
      }

      const alert = await userService.createAlert(
        req.user._id,
        { symbol, condition, value }
      );

      res.status(201).json({
        success: true,
        message: 'Alert created',
        data: alert
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/user/alerts
  async getAlerts(req, res, next) {
    try {
      const alerts = await userService.getAlerts(req.user._id);

      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/user/alerts/:alertId
  async deleteAlert(req, res, next) {
    try {
      await userService.deleteAlert(req.user._id, req.params.alertId);

      res.status(200).json({
        success: true,
        message: 'Alert deleted'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;