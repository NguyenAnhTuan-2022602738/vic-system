/**
 * Các route dự báo.
 */

import { Router } from 'express';
import { 
  getForecast, 
  getAdjustedForecast, 
  getForecastHistory,
  getMultiHorizon,
  getPerformance,
  triggerPipeline,
  getLatestPipeline,
  getHistoryComparison
} from './forecast.controller.js';

const router = Router();

// Pipeline T+2
router.post('/trigger-update', triggerPipeline);
router.get('/latest', getLatestPipeline);
router.get('/comparison', getHistoryComparison);

router.post('/', getForecast);
router.post('/adjusted', getAdjustedForecast);
router.get('/history', getForecastHistory);
router.get('/multi-horizon', getMultiHorizon);
router.get('/performance', getPerformance);

export default router;
