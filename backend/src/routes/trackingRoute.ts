import express, { Request, Response } from 'express';
import { pool } from '../db';
import { analyzeUserSession, analyzeUserSessionWithAI } from '../analyticsService';

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

export default router;
