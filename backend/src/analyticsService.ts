import { pool } from './db';

// This defines what our final function will return to the user
interface SessionAnalysisResult {
  success: boolean;
  intentScore: number;
  summary: string;
}

interface TrackingLog {
  event_name: string;
  url_path?: string;
  created_at?: string;
}

async function fetchSessionLogs(sessionId: string): Promise<TrackingLog[]> {
  // If sessionId is a synthetic user mapping, resolve from users.action_history
  const gaSidMatch = /^ga4_sid_(\d+)$/.exec(sessionId);
  if (gaSidMatch) {
    const userId = Number(gaSidMatch[1]);
    const userResult = await pool.query('SELECT action_history FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length) {
      const actionHistory: string[] = userResult.rows[0].action_history || [];
      return actionHistory.map((action) => ({
        event_name: action,
        url_path: action.includes('/') ? action : undefined,
        created_at: undefined
      }));
    }
  }

  try {
    const trackingQuery = `
      SELECT event_name, url_path, created_at 
      FROM tracking_logs 
      WHERE session_id = $1 
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(trackingQuery, [sessionId]);
    return result.rows || [];
  } catch (error: any) {
    console.warn('Analytics DB query failed, returning empty event list:', error?.message || error);
    return [];
  }
}
/**
 * Analyzes a user's session history to generate a behavioral summary and conversion intent score.
 * @param sessionId The active session identifier to query
 */
export async function analyzeUserSession(sessionId: string): Promise<SessionAnalysisResult> {
  try {
    const logs = await fetchSessionLogs(sessionId);

    if (!logs.length) {
      return {
        success: true,
        intentScore: 50,
        summary: 'New session initiated. Tracking telemetry is actively waiting for user actions.'
      };
    }

    let intentScore = 0;
    let productViews = 0;
    let addedToCart = false;
    let visitedCheckout = false;

    // Loop through each action log recorded in this session
    for (const log of logs) {
      const event = (log.event_name || '').toLowerCase();
      const path = (log.url_path || '').toLowerCase();

      if (event === 'add_to_cart' || path.includes('cart')) {
        intentScore += 30;
        addedToCart = true;
      } else if (event === 'click_checkout' || path.includes('checkout')) {
        intentScore += 50;
        visitedCheckout = true;
      } else if (event === 'click_product' || path.includes('product')) {
        intentScore += 10;
        productViews++;
      }
    }

    // Cap the score at 100 max
    if (intentScore > 100) intentScore = 100;

    // Generate a clean, structured summary statement based on behavior
    let summary = `User viewed ${productViews} products during this session.`;
    if (visitedCheckout) {
      summary += ' High conversion likelihood: User reached the checkout funnel.';
    } else if (addedToCart) {
      summary += ' Moderate conversion likelihood: User added items to their shopping cart.';
    } else if (productViews > 0) {
      summary += ' Low conversion likelihood: User is in the early consideration/browsing stage.';
    } else {
      summary += ' No commercial intent patterns identified yet.';
    }

    return {
      success: true,
      intentScore,
      summary
    };

  } catch (error) {
    console.error(`Failed executing session analysis for ID ${sessionId}:`, error);
    // Return a safe failure object so callers never crash the app
    return {
      success: false,
      intentScore: 0,
      summary: 'Unable to evaluate session analytics at this time.'
    };
  }
}

/**
 * Use an AI service to generate a concise summary and intent score for a session.
 * Falls back to a safe response when AI or the API key is not available.
 */
export async function analyzeUserSessionWithAI(sessionId: string): Promise<SessionAnalysisResult> {
  try {
    const logs = await fetchSessionLogs(sessionId);

    if (!logs.length) {
      return {
        success: true,
        intentScore: 50,
        summary: 'New session initiated. Tracking telemetry is actively waiting for user actions.'
      };
    }

    // Build a short events transcript for the AI prompt
    const eventsText = logs.map((l: any) => `- ${l.created_at || 'time'}: ${l.event_name || 'event'} ${l.url_path || ''}`).join('\n');

    // Require an API key to use the external AI; otherwise fall back
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      // Fallback: reuse heuristic scoring from non-AI function
      let intentScore = 0;
      let productViews = 0;
      let addedToCart = false;
      let visitedCheckout = false;
      for (const log of logs) {
        const event = (log.event_name || '').toLowerCase();
        const path = (log.url_path || '').toLowerCase();
        if (event === 'add_to_cart' || path.includes('cart')) { intentScore += 30; addedToCart = true; }
        else if (event === 'click_checkout' || path.includes('checkout')) { intentScore += 50; visitedCheckout = true; }
        else if (event === 'click_product' || path.includes('product')) { intentScore += 10; productViews++; }
      }
      if (intentScore > 100) intentScore = 100;
      let summary = `User viewed ${productViews} products during this session.`;
      if (visitedCheckout) summary += ' High conversion likelihood: User reached the checkout funnel.';
      else if (addedToCart) summary += ' Moderate conversion likelihood: User added items to their shopping cart.';
      else if (productViews > 0) summary += ' Low conversion likelihood: User is in the early consideration/browsing stage.';
      else summary += ' No commercial intent patterns identified yet.';

      return { success: true, intentScore, summary };
    }

    // Call OpenAI Chat Completions to get a structured JSON response
    const systemPrompt = 'You are an assistant that summarizes e-commerce session events and returns a JSON object with keys: intentScore (number 0-100) and summary (short string). Respond ONLY with valid JSON.';
    const userPrompt = `Session events:\n${eventsText}\n\nProduce a JSON object with intentScore and summary.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.2
      })
    });

    const payload = await resp.json();
    const text = payload?.choices?.[0]?.message?.content || payload?.choices?.[0]?.text || '';

    // Try to extract JSON substring if model added extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;

    try {
      const parsed = JSON.parse(jsonText);
      let intentScore = Number(parsed.intentScore) || 0;
      if (intentScore < 0) intentScore = 0;
      if (intentScore > 100) intentScore = 100;
      const summary = String(parsed.summary || '').trim() || 'No summary produced.';
      return { success: true, intentScore, summary };
    } catch (e) {
      console.error('AI response parse error:', e, 'raw:', text);
      // Fall back to heuristic if parsing fails
      let intentScore = 0;
      let productViews = 0;
      let addedToCart = false;
      let visitedCheckout = false;
      for (const log of logs) {
        const event = (log.event_name || '').toLowerCase();
        const path = (log.url_path || '').toLowerCase();
        if (event === 'add_to_cart' || path.includes('cart')) { intentScore += 30; addedToCart = true; }
        else if (event === 'click_checkout' || path.includes('checkout')) { intentScore += 50; visitedCheckout = true; }
        else if (event === 'click_product' || path.includes('product')) { intentScore += 10; productViews++; }
      }
      if (intentScore > 100) intentScore = 100;
      let summary = `User viewed ${productViews} products during this session.`;
      if (visitedCheckout) summary += ' High conversion likelihood: User reached the checkout funnel.';
      else if (addedToCart) summary += ' Moderate conversion likelihood: User added items to their shopping cart.';
      else if (productViews > 0) summary += ' Low conversion likelihood: User is in the early consideration/browsing stage.';
      else summary += ' No commercial intent patterns identified yet.';
      return { success: true, intentScore, summary };
    }

  } catch (error) {
    console.error(`AI-backed session analysis failed for ID ${sessionId}:`, error);
    return {
      success: false,
      intentScore: 0,
      summary: 'Unable to evaluate session analytics at this time.'
    };
  }
}