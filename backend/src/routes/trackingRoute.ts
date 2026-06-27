import express, { Request, Response } from 'express';
import { pool } from '../db';
import { analyzeUserSession, analyzeUserSessionWithAI, getIntentScoreForUser } from '../analyticsService';

const router = express.Router();

type PopupConfig = {
  shouldShow: boolean;
  title: string;
  message: string;
  couponCode: string;
};

type UserEvent = { event_name: string };

function parseAppUserId(userPseudoId: string): number | null {
  const match = /^usr_(\d+)$/.exec(userPseudoId);
  return match ? Number(match[1]) : null;
}

async function getPostgresActionEvents(userId: number): Promise<UserEvent[]> {
  const result = await pool.query(
    'SELECT action_history FROM users WHERE id = $1',
    [userId]
  );
  const actions: string[] = result.rows[0]?.action_history ?? [];
  return actions.map((event_name) => ({ event_name }));
}

function buildPopupConfig(events: UserEvent[]): PopupConfig {
  const popupConfig: PopupConfig = {
    shouldShow: false,
    title: '',
    message: '',
    couponCode: '',
  };

  if (events.length === 0) {
    return popupConfig;
  }

  const hasCartAdded = events.some((e) => e.event_name === 'add_to_cart');
  const hasPurchased = events.some((e) => e.event_name === 'purchase');

  if (hasCartAdded && !hasPurchased) {
    return {
      shouldShow: true,
      title: 'We Saved Your Cart',
      message: 'Items from your last visit are still waiting. Complete checkout right now to unlock an extra 15% discount!',
      couponCode: 'RETURN15',
    };
  }

  if (events.length > 12) {
    return {
      shouldShow: true,
      title: 'Special Member Reward',
      message: 'Welcome back! Thanks for being an active customer. Take 10% off any premium apparel item today.',
      couponCode: 'STYLE10',
    };
  }

  return popupConfig;
}

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


const userIdToUserPseudoId: Record<string, string> = {
  "1": "1015505499.1782367591",
  "2": "199217271.1782480417",
  "3": "1673580516.1782491913",
  "4": "1077795746.1782479718",
}

// NEW ENDPOINT: Triggered on user landing to check BigQuery history and pass back popup instructions
router.get('/user-popup-intent/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const userPseudoId = userIdToUserPseudoId[userId];
    if (!userPseudoId) {
      return res.status(400).json({ success: false, error: 'User ID tracking parameter missing.' });
    }

    // 1. Fetch events from BigQuery (GA4) and PostgreSQL (track-action history)
    const bigQueryData = await getIntentScoreForUser(userPseudoId);
    let events: UserEvent[] = bigQueryData.success ? bigQueryData.rawData : [];

    const appUserId = parseAppUserId(userId);
    if (appUserId) {
      const postgresEvents = await getPostgresActionEvents(appUserId);
      events = [...events, ...postgresEvents];
    }

    const popupConfig = buildPopupConfig(events);

    return res.json({ success: true, popup: popupConfig });
  } catch (error: any) {
    console.error('API Evaluation Route Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
  
