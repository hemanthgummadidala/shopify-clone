import * as db from '../src/db';

// Ensure AI API key is unset so AI-backed function falls back to heuristics
process.env.OPENAI_API_KEY = '';

// Mock pool.query before importing the analytics module
(db.pool as any).query = async (text: string, params: any[]) => {
  // Return a set of mock events for the provided session id
  return {
    rows: [
      { event_name: 'click_product', url_path: '/product/sku-123', created_at: '2026-06-23T10:00:00Z' },
      { event_name: 'click_product', url_path: '/product/sku-456', created_at: '2026-06-23T10:00:05Z' },
      { event_name: 'add_to_cart', url_path: '/cart', created_at: '2026-06-23T10:01:00Z' }
    ]
  };
};

(async () => {
  try {
    const mod = await import('../src/analyticsService');
    const { analyzeUserSession, analyzeUserSessionWithAI } = mod;

    console.log('Running analyzeUserSession (heuristic)...');
    const res1 = await analyzeUserSession('test-session-1');
    console.log('analyzeUserSession result:', res1);

    console.log('\nRunning analyzeUserSessionWithAI (AI key unset -> fallback heuristics)...');
    const res2 = await analyzeUserSessionWithAI('test-session-1');
    console.log('analyzeUserSessionWithAI result:', res2);

    process.exit(0);
  } catch (err) {
    console.error('Test harness error:', err);
    process.exit(2);
  }
})();
