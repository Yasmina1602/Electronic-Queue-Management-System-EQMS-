import { query } from '../config/db.js';
import { calculateDiscount } from '../services/loyaltyService.js';

export async function lookupCustomer(req, res, next) {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Kod kiritilmadi' });
    }
    const cleanCode = code.trim().toUpperCase();
    const custVariant = cleanCode.startsWith('CUST-') ? cleanCode : `CUST-${cleanCode}`;
    const refVariant = cleanCode.startsWith('REF-') ? cleanCode : `REF-${cleanCode}`;

    // 1. Search in anonymous_customers by exact code, prefix variant, or partial match
    let result = await query(
      `SELECT c.*,
              GREATEST(c.visits_count, 1, (SELECT COUNT(*)::int FROM queues q WHERE q.anonymous_customer_id = c.id)) as actual_visits
       FROM anonymous_customers c
       WHERE c.customer_code = $1 
          OR c.customer_code = $2 
          OR c.referral_code = $1 
          OR c.referral_code = $3
          OR c.customer_code ILIKE $4
       ORDER BY c.last_visit_at DESC
       LIMIT 1`,
      [cleanCode, custVariant, refVariant, `%${cleanCode}%`]
    );

    // 2. If not found by direct customer search, search if this code matches any ticket
    if (result.rows.length === 0) {
      const qRes = await query(
        `SELECT q.*, c.customer_code as c_code, c.id as c_id
         FROM queues q
         JOIN anonymous_customers c ON q.anonymous_customer_id = c.id
         WHERE q.ticket_number = $1 OR c.customer_code = $1 OR c.customer_code = $2
         LIMIT 1`,
        [cleanCode, custVariant]
      );
      if (qRes.rows.length > 0 && qRes.rows[0].c_code) {
        result = await query(
          `SELECT c.*,
                  GREATEST(c.visits_count, 1, (SELECT COUNT(*)::int FROM queues q WHERE q.anonymous_customer_id = c.id)) as actual_visits
           FROM anonymous_customers c WHERE c.customer_code = $1`,
          [qRes.rows[0].c_code]
        );
      }
    }

    // 3. If STILL not found, auto-create the profile so verification never fails
    if (result.rows.length === 0) {
      const id = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const targetCustCode = custVariant;
      const targetRefCode = `REF-${targetCustCode.replace('CUST-', '')}`;
      const insertRes = await query(
        `INSERT INTO anonymous_customers 
          (id, customer_code, referral_code, visits_count, bonus_balance, discount_percent, created_at, last_visit_at)
         VALUES ($1, $2, $3, 1, 0, 0, NOW(), NOW())
         ON CONFLICT (customer_code) DO UPDATE SET visits_count = anonymous_customers.visits_count + 1, last_visit_at = NOW()
         RETURNING *`,
        [id, targetCustCode, targetRefCode]
      );
      const row = insertRes.rows[0];
      row.visits_count = Math.max(Number(row.visits_count) || 1, 1);
      row.discount_percent = calculateDiscount(row.visits_count);
      return res.json({ success: true, customer: row });
    }

    const row = result.rows[0];
    // Har bir kiritilganda / navbatdagi tashrifda tashriflar soni 1 taga oshadi va yangi chegirma hisoblanadi
    const baseVisits = Math.max(Number(row.visits_count) || 1, Number(row.actual_visits) || 1);
    const newVisits = baseVisits + 1;
    const disc = calculateDiscount(newVisits);

    await query(
      `UPDATE anonymous_customers 
       SET visits_count = $1, discount_percent = $2, last_visit_at = NOW() 
       WHERE id = $3`,
      [newVisits, disc, row.id]
    );

    row.visits_count = newVisits;
    row.discount_percent = disc;

    res.json({ success: true, customer: row });
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

