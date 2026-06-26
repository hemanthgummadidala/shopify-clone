import express, { Request, Response } from 'express';
import { pool } from '../db';
import { analyzeUserSession, analyzeUserSessionWithAI, getIntentScoreForUser } from '../analyticsService';

const router = express.Router();

router.post('/track-action', async (req: Request, res: Response) => {
  try {
    const { userId, actionName } = req.body;

    if (!userId || !actionName) {
      return res.status(400).json({ error: "Missing tracking telemetry parameters." });
    }

    // 1. Append the new action straight into your PostgreSQL text array column
    await pool.query(
      'UPDATE users SET action_history = array_append(action_history, $1) WHERE id = $2',
      [actionName, userId]
    );

    // 2. Return a clean success response without trying to calculate a score
    res.json({ 
      success: true, 
      message: "Action tracked successfully" 
    });

  } catch (error) {
    console.error('Tracking route error:', error);
    res.status(500).json({ error: "Internal server error tracking action." });
  }
});

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing required sessionId parameter." });
    }

    const analysisResult = await analyzeUserSession(sessionId);
    return res.status(200).json(analysisResult);

  } catch (error) {
    return res.status(500).json({ error: "Internal server error calculating session intelligence." });
  }
});

router.post('/analyze/ai', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing required sessionId parameter." });
    }

    const analysisResult = await analyzeUserSessionWithAI(sessionId);
    return res.status(200).json(analysisResult);

  } catch (error) {
    return res.status(500).json({ error: "Internal server error calculating AI session intelligence." });
  }
});

// NEW ENDPOINT: Triggered on user landing to check BigQuery history and pass back popup instructions
router.get('/user-popup-intent/:userId', async (req: Request, res: Response) => {
  try {
    const userPseudoId = req.params.userId;
    if (!userPseudoId) {
      return res.status(400).json({ success: false, error: 'User ID tracking parameter missing.' });
    }

    // 1. Fetch user event data rows directly from Google BigQuery
    const bigQueryData = await getIntentScoreForUser(userPseudoId);

    // Default configuration map: Hidden by default for users with no history
    let popupConfig = { shouldShow: false, title: '', message: '', couponCode: '' };

    if (bigQueryData.success && bigQueryData.totalEvents > 0) {
      const events = bigQueryData.rawData;

      const hasCartAdded = events.some((e: any) => e.event_name === 'add_to_cart');
      const hasPurchased = events.some((e: any) => e.event_name === 'purchase');

      // Rule Set A: Abandoned Cart Context
      if (hasCartAdded && !hasPurchased) {
        popupConfig = {
          shouldShow: true,
          title: 'We Saved Your Cart',
          message: 'Items from your last visit are still waiting. Complete checkout right now to unlock an extra 15% discount!',
          couponCode: 'RETURN15'
        };
      } 
      // Rule Set B: High Engagement Window Shopper
      else if (events.length > 12) {
        popupConfig = {
          shouldShow: true,
          title: 'Special Member Reward',
          message: 'Welcome back! Thanks for being an active customer. Take 10% off any premium apparel item today.',
          couponCode: 'STYLE10'
        };
      }
    }

    return res.json({ success: true, popup: popupConfig });
  } catch (error: any) {
    console.error('API Evaluation Route Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
  
