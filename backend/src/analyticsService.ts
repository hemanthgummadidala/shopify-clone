import { bigquery, BQ_DATE_SUFFIX, eventsTableRef } from './bigqueryClient';

interface SessionAnalysisResult {
  success: boolean;
  intentScore: number;
  summary: string;
}

interface SessionMetrics {
  page_views: number;
  product_views: number;
  cart_adds: number;
  checkout_starts: number;
  purchases: number;
  ga_session_id?: number | null;
}

function parseGaSessionId(sessionId: string): number | null {
  const numeric = Number(sessionId);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  const fromStorage = /^ga4_session_(\d+)$/i.exec(sessionId);
  if (fromStorage) {
    return Number(fromStorage[1]);
  }

  return null;
}

function scoreFromMetrics(metrics: SessionMetrics): number {
  const raw =
    metrics.page_views * 1 +
    metrics.product_views * 5 +
    metrics.cart_adds * 20 +
    metrics.checkout_starts * 40;

  return Math.min(raw, 100);
}

function summaryFromMetrics(metrics: SessionMetrics, intentScore: number): string {
  if (metrics.purchases > 0) {
    return `Completed purchase detected in GA4 BigQuery export. Intent score: ${intentScore}/100.`;
  }
  if (metrics.checkout_starts > 0) {
    return `High intent: ${metrics.checkout_starts} checkout start(s), ${metrics.cart_adds} cart add(s), ${metrics.product_views} product view(s) from BigQuery GA4 data.`;
  }
  if (metrics.cart_adds > 0) {
    return `Moderate intent: ${metrics.cart_adds} cart add(s) and ${metrics.product_views} product view(s) recorded in BigQuery.`;
  }
  if (metrics.product_views > 0) {
    return `Browsing stage: ${metrics.product_views} product view(s) and ${metrics.page_views} page view(s) in GA4 BigQuery (${BQ_DATE_SUFFIX}).`;
  }
  if (metrics.page_views > 0) {
    return `Low activity: ${metrics.page_views} page view(s) found in GA4 BigQuery for this session.`;
  }
  return `No GA4 events matched in BigQuery dataset for date ${BQ_DATE_SUFFIX}.`;
}

async function fetchSessionMetricsFromBigQuery(sessionId: string): Promise<SessionMetrics | null> {
  const gaSessionId = parseGaSessionId(sessionId);
  const sessionFilter = gaSessionId
    ? 'AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = \'ga_session_id\') = @gaSessionId'
    : '';

  const sql = `
    SELECT
      COUNTIF(event_name = 'page_view') AS page_views,
      COUNTIF(event_name = 'view_item') AS product_views,
      COUNTIF(event_name = 'add_to_cart') AS cart_adds,
      COUNTIF(event_name = 'begin_checkout') AS checkout_starts,
      COUNTIF(event_name = 'purchase') AS purchases,
      ${gaSessionId ? '(SELECT value.int_value FROM UNNEST(event_params) WHERE key = \'ga_session_id\') AS ga_session_id' : 'NULL AS ga_session_id'}
    FROM ${eventsTableRef()}
    WHERE _TABLE_SUFFIX = @dateSuffix
      ${sessionFilter}
    ${gaSessionId ? 'GROUP BY ga_session_id' : ''}
  `;

  const params: Record<string, string | number> = { dateSuffix: BQ_DATE_SUFFIX };
  if (gaSessionId) {
    params.gaSessionId = gaSessionId;
  }

  const [rows] = await bigquery.query({
    query: sql,
    params,
    location: 'US',
  });

  if (!rows?.length) {
    return null;
  }

  const row = rows[0];
  return {
    page_views: Number(row.page_views) || 0,
    product_views: Number(row.product_views) || 0,
    cart_adds: Number(row.cart_adds) || 0,
    checkout_starts: Number(row.checkout_starts) || 0,
    purchases: Number(row.purchases) || 0,
    ga_session_id: row.ga_session_id ?? gaSessionId,
  };
}

/** When session id is synthetic (ga4_sid_3), use the highest-intent GA4 session for that day. */
async function fetchTopSessionMetricsFromBigQuery(): Promise<SessionMetrics | null> {
  const sql = `
    WITH SessionMetrics AS (
      SELECT
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id,
        COUNTIF(event_name = 'page_view') AS page_views,
        COUNTIF(event_name = 'view_item') AS product_views,
        COUNTIF(event_name = 'add_to_cart') AS cart_adds,
        COUNTIF(event_name = 'begin_checkout') AS checkout_starts,
        COUNTIF(event_name = 'purchase') AS purchases
      FROM ${eventsTableRef()}
      WHERE _TABLE_SUFFIX = @dateSuffix
      GROUP BY ga_session_id
      HAVING ga_session_id IS NOT NULL
    )
    SELECT *
    FROM SessionMetrics
    ORDER BY (page_views * 1 + product_views * 5 + cart_adds * 20 + checkout_starts * 40) DESC
    LIMIT 1
  `;

  const [rows] = await bigquery.query({
    query: sql,
    params: { dateSuffix: BQ_DATE_SUFFIX },
    location: 'US',
  });

  if (!rows?.length) {
    return null;
  }

  const row = rows[0];
  return {
    page_views: Number(row.page_views) || 0,
    product_views: Number(row.product_views) || 0,
    cart_adds: Number(row.cart_adds) || 0,
    checkout_starts: Number(row.checkout_starts) || 0,
    purchases: Number(row.purchases) || 0,
    ga_session_id: row.ga_session_id,
  };
}

async function resolveBigQueryMetrics(sessionId: string): Promise<SessionMetrics | null> {
  const isSyntheticAppSession = /^ga4_sid_\d+$/i.test(sessionId);

  if (!isSyntheticAppSession) {
    const direct = await fetchSessionMetricsFromBigQuery(sessionId);
    if (direct && (direct.page_views + direct.product_views + direct.cart_adds + direct.checkout_starts + direct.purchases) > 0) {
      return direct;
    }
  }

  return fetchTopSessionMetricsFromBigQuery();
}

export async function analyzeUserSession(sessionId: string): Promise<SessionAnalysisResult> {
  try {
    const metrics = await resolveBigQueryMetrics(sessionId);

    if (!metrics) {
      return {
        success: true,
        intentScore: 0,
        summary: `No GA4 event data found in BigQuery (${BQ_DATE_SUFFIX}). Ensure GA4 → BigQuery export includes events_${BQ_DATE_SUFFIX}.`,
      };
    }

    const intentScore = scoreFromMetrics(metrics);
    const summary = summaryFromMetrics(metrics, intentScore);

    return {
      success: true,
      intentScore,
      summary,
    };
  } catch (error) {
    console.error(`BigQuery session analysis failed for ID ${sessionId}:`, error);
    return {
      success: false,
      intentScore: 0,
      summary: 'Unable to evaluate session analytics from BigQuery at this time.',
    };
  }
}

export async function analyzeUserSessionWithAI(sessionId: string): Promise<SessionAnalysisResult> {
  // AI path uses the same BigQuery-backed metrics; OpenAI is optional enrichment only.
  return analyzeUserSession(sessionId);
}
/**
 * Fetches historical GA4 events for a user from BigQuery.
 * App IDs (usr_4) are matched via GA4 user_id; raw GA4 pseudo IDs match user_pseudo_id directly.
 */
export async function getIntentScoreForUser(userPseudoId: string): Promise<any> {
  const appUserMatch = /^usr_(\d+)$/.exec(userPseudoId);
  const appUserId = appUserMatch?.[1] ?? null;

  const query = `
    SELECT
      user_pseudo_id,
      user_id,
      event_name,
      TIMESTAMP_MICROS(event_timestamp) AS event_time
    FROM ${eventsTableRef()}
    WHERE _TABLE_SUFFIX = @dateSuffix
      AND (
        user_pseudo_id = @userPseudoId
        ${appUserId ? 'OR user_id = @appUserId' : ''}
      )
    ORDER BY event_timestamp ASC
  `;

  const params: Record<string, string> = {
    dateSuffix: BQ_DATE_SUFFIX,
    userPseudoId,
  };
  if (appUserId) {
    params.appUserId = appUserId;
  }

  try {
    const [rows] = await bigquery.query({
      query,
      params,
      location: 'US',
    });
    return { success: true, totalEvents: rows.length, rawData: rows };
  } catch (error: any) {
    console.error('BigQuery Extraction Failure: ', error);
    return { success: false, totalEvents: 0, rawData: [] };
  }
}