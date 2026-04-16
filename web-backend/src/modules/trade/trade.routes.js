/**
 * Các route giao dịch.
 */

import { Router } from 'express';
import { getTrades, createTrade, updateTrade, deleteTrade, getTradeStats } from './trade.controller.js';

const router = Router();

router.get('/', getTrades);
router.get('/stats', getTradeStats); // Mới: Thống kê tổng quan
router.post('/', createTrade);
router.put('/:id', updateTrade);
router.delete('/:id', deleteTrade);



export default router;
