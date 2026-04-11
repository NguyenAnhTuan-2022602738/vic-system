import express from 'express';
import marketController from './market.controller.js';

const router = express.Router();

router.get('/history', marketController.getHistory.bind(marketController));
router.get('/volume-profile', marketController.getVolumeProfile.bind(marketController));

export default router;
