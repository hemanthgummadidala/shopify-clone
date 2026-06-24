import { BigQuery } from '@google-cloud/bigquery';
import express, { Request, Response } from 'express';

const router = express.Router();

// 1. Initialize the Google BigQuery Client
const bigquery = new BigQuery({
  projectId: 'shopify-clone-499604',
  keyFilename: './config/gcp-service-account-key.json' 
});

// 2. GET API: Fetch session intent metrics and willingness statuses
router.get('/api/session-intent-scores', async (req: Request, res: Response) => {
  const sqlQuery = `
    WITH SessionMetrics AS (
      SELECT
        user_pseudo_id,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id,
        MAX(TIMESTAMP_MICROS(event_timestamp)) AS last_action_time,
        COUNTIF(event_name = 'page_view') AS page_views,
        COUNTIF(event_name = 'view_item') AS product_views,
        COUNTIF(event_name = 'add_to_cart') AS cart_adds,
        COUNTIF(event_name = 'begin_checkout') AS checkout_starts,
        COUNTIF(event_name = 'purchase') AS purchases
      FROM \`bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN '20201201' AND '20201231'
      GROUP BY user_pseudo_id, ga_session_id
      HAVING ga_session_id IS NOT NULL
    ),
    CalculatedScores AS (
      SELECT
        user_pseudo_id,
        ga_session_id,
        purchases,
        last_action_time,
        ((page_views * 1) + (product_views * 5) + (cart_adds * 20) + (checkout_starts * 40)) AS raw_intent_score
      FROM SessionMetrics
    )
    SELECT
      user_pseudo_id,
      ga_session_id,
      raw_intent_score,
      last_action_time,
      CASE 
        WHEN purchases > 0 THEN '✅ Completed Purchase'
        WHEN raw_intent_score >= 50 THEN '🔥 High Intent (Send Email / Show Popup)'
        WHEN raw_intent_score BETWEEN 15 AND 49 THEN '⚡ Mid Intent'
        ELSE '🧊 Low Intent'
      END AS buying_willingness
    FROM CalculatedScores
    ORDER BY raw_intent_score DESC
    LIMIT 100;
  `;

  try {
    const options = {
      query: sqlQuery,
      location: 'US',
    };

    const [rows] = await bigquery.query(options);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      sessions: rows
    });

  } catch (error: any) {
    console.error('❌ BigQuery Scoring Engine Failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;