/**
 * Các route dashboard.
 */

import { Router } from 'express';
import { getStats } from './dashboard.controller.js';

const router = Router();

router.get('/stats', getStats);

export default router;
