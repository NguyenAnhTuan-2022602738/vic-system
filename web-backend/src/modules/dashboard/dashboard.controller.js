/**
 * Controller dashboard.
 */

import { dashboardService } from './dashboard.service.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    res.json({ success: true, data: stats, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};
