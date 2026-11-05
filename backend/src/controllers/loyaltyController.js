import { query } from '../config/db.js';

export async function lookupCustomer(req, res, next) {
  try {
    const { code } = req.params;
    const result = await query(
      `SELECT id, customer_code, referral_code, visits_count, bonus_balance, discount_percent, created_at, last_visit_at
       FROM anonymous_customers
       WHERE customer_code = $1 OR referral_code = $1`,
      [code.trim().toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mijoz kartasi / kodi topilmadi!' });
    }

    res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getLoyaltyStats(req, res, next) {
  try {
    const [summaryRes, topReferrersRes, recentLogsRes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*)::int as total_customers,
          COALESCE(SUM(visits_count), 0)::int as total_visits,
          COALESCE(SUM(bonus_balance), 0)::numeric as total_bonus_balance,
          COUNT(CASE WHEN visits_count >= 3 THEN 1 END)::int as repeated_customers
        FROM anonymous_customers
      `),
      query(`
        SELECT c.customer_code, c.referral_code, c.bonus_balance, COUNT(r.id)::int as referred_count
        FROM anonymous_customers c
        LEFT JOIN anonymous_customers r ON c.id = r.referred_by_id
        GROUP BY c.id
        HAVING COUNT(r.id) > 0
        ORDER BY referred_count DESC
        LIMIT 10
      `),
      query(`
        SELECT l.*, c.customer_code
        FROM customer_bonus_logs l
        JOIN anonymous_customers c ON l.customer_id = c.id
        ORDER BY l.created_at DESC
        LIMIT 20
      `),
    ]);

    res.json({
      success: true,
      stats: summaryRes.rows[0],
      topReferrers: topReferrersRes.rows,
      recentLogs: recentLogsRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

