/**
 * Controller dự báo — xử lý các request HTTP.
 */

import { forecastService } from './forecast.service.js';

export const triggerPipeline = async (req, res, next) => {
  try {
    const result = await forecastService.triggerPipeline();
    res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getLatestPipeline = async (req, res, next) => {
  try {
    const result = await forecastService.getLatestPipeline();
    res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getForecast = async (req, res, next) => {
  try {
    const { horizon, target_return, alpha, beta } = req.body;
    const result = await forecastService.forecast({ horizon, target_return, alpha, beta });
    res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getAdjustedForecast = async (req, res, next) => {
  try {
    const { horizon, news_text } = req.body;
    const result = await forecastService.adjustedForecast(horizon, news_text);
    res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getForecastHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await forecastService.getHistory(limit);
    res.json({ success: true, data: history, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getMultiHorizon = async (req, res, next) => {
  try {
    const targetReturn = parseFloat(req.query.target_return) || 0.05;
    const result = await forecastService.getMultiHorizon(targetReturn);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPerformance = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await forecastService.getPerformance(days);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};


export const getHistoryComparison = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số date (YYYY-MM-DD)' });
    }
    const result = await forecastService.getHistoryComparison(date);
    res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};
