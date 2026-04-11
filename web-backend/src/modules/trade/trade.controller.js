/**
 * Controller giao dịch.
 */

import { tradeService } from './trade.service.js';

export const getTrades = async (req, res, next) => {
  try {
    const trades = await tradeService.getAll();
    res.json({ success: true, data: trades, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const createTrade = async (req, res, next) => {
  try {
    const trade = await tradeService.create(req.body);
    res.status(201).json({ success: true, data: trade, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const updateTrade = async (req, res, next) => {
  try {
    const trade = await tradeService.update(req.params.id, req.body);
    res.json({ success: true, data: trade, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const deleteTrade = async (req, res, next) => {
  try {
    await tradeService.delete(req.params.id);
    res.json({ success: true, message: 'Trade record deleted successfully', meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};

export const getTradeStats = async (req, res, next) => {
  try {
    const stats = await tradeService.getStats();
    res.json({ success: true, data: stats, meta: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
};
