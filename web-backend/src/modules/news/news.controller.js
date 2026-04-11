/**
 * Controller tin tức.
 */

import { newsService } from './news.service.js';

export const analyzeNews = async (req, res, next) => {
  try {
    const { text } = req.body;
    const result = await newsService.analyze(text);
    res.json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getRecentNews = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const news = await newsService.getRecent(limit);
    res.json({ success: true, data: news, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getLatestNews = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const news = await newsService.getLatest(limit);
    res.json({ success: true, data: news, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const triggerCrawl = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Chuyền force = true để ép cào mới
    const news = await newsService.getLatest(limit, true);
    res.json({ success: true, data: news, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getHistoryNews = async (req, res, next) => {
  try {
    const { date, limit = 10 } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số date (YYYY-MM-DD)' });
    }
    const news = await newsService.getHistory(date, parseInt(limit));
    res.json({ success: true, data: news, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};
