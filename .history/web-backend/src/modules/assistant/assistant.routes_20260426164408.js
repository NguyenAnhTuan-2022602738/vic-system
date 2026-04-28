import express from 'express';
import { requestAssistantChat } from '../../integrations/ai_client.js';

const router = express.Router();

/**
 * Endpoint Chat với AI Assistant (Proxy tới AI Service)
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const result = await requestAssistantChat(message, context);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
