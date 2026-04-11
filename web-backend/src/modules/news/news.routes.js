/**
 * Các route tin tức.
 */

import { Router } from 'express';
import { analyzeNews, getRecentNews, getLatestNews, triggerCrawl, getHistoryNews } from './news.controller.js';

const router = Router();

router.post('/analyze', analyzeNews);
router.get('/recent', getRecentNews);
router.get('/latest', getLatestNews);
router.get('/history', getHistoryNews);
router.post('/trigger-crawl', triggerCrawl);

export default router;
