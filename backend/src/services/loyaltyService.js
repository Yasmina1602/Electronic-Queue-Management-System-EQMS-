import crypto from 'crypto';
import { pool, query, withTransaction } from '../config/db.js';

/**
 * Generate secure anonymous token (8 belgili unikal, takrorlanmas token - 4.2 milliard kombinatsiya)
 */
export function generateAnonymousCode(prefix = 'CUST') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Dynamic loyalty discount tiers (Superadmin va Admin tomonidan sozlanadi)
 */
let dynamicTiers = [
  { min_visits: 10, discount_percent: 15 },
  { min_visits: 5, discount_percent: 10 },
  { min_visits: 3, discount_percent: 5 },
];

export async function refreshLoyaltyTiersCache() {
  try {
    const res = await query(
      `SELECT min_visits, discount_percent FROM loyalty_tiers WHERE active = true ORDER BY min_visits DESC`
    );
    if (res.rows.length > 0) {
      dynamicTiers = res.rows.map((r) => ({
        min_visits: Number(r.min_visits),
        discount_percent: Number(r.discount_percent),
      }));
    }
  } catch (err) {
    // fallback defaults
  }
}

// Initial cache load
refreshLoyaltyTiersCache().catch(() => {});

/**
 * Calculate discount based on visits count and active loyalty tiers
 */
export function calculateDiscount(visitsCount) {
  const v = Number(visitsCount) || 0;
  for (const tier of dynamicTiers) {
    if (v >= tier.min_visits) {
      return tier.discount_percent;
    }
  }
  return 0;
}

/**
 * Find or create an anonymous customer profile
 * Absolutely NO personally identifiable information is stored
 */
export async function getOrCreateAnonymousCustomer(providedCode = null, referralCode = null, existingClient = null) {
  const runner = existingClient || pool;

  if (providedCode) {
    const cleanProvided = String(providedCode).trim().toUpperCase();
    const custVar = cleanProvided.startsWith('CUST-') ? cleanProvided : `CUST-${cleanProvided}`;
    const existing = await runner.query(
      `SELECT * FROM anonymous_customers 
       WHERE UPPER(customer_code) = UPPER($1) 
          OR UPPER(customer_code) = UPPER($2)
          OR customer_code ILIKE $3
       LIMIT 1`,
      [cleanProvided, custVar, `%${cleanProvided}%`]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
  }

  // Create new anonymous customer with guaranteed unique 8-character token
  const id = `cust-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const cleanCode = providedCode ? String(providedCode).trim().toUpperCase() : null;
  const customerCode = cleanCode 
    ? (cleanCode.startsWith('CUST-') ? cleanCode : `CUST-${cleanCode}`)
    : generateAnonymousCode('CUST');
  const newReferralCode = generateAnonymousCode('REF');

  let referredById = null;
  if (referralCode && referralCode !== newReferralCode) {
    const cleanRef = String(referralCode).trim().toUpperCase();
    const referrerRes = await runner.query(
      `SELECT id FROM anonymous_customers WHERE UPPER(referral_code) = UPPER($1) LIMIT 1`,
      [cleanRef]
    );
    if (referrerRes.rows.length > 0) {
      referredById = referrerRes.rows[0].id;
    }
  }

  const insertRes = await runner.query(
    `INSERT INTO anonymous_customers 
      (id, customer_code, referral_code, referred_by_id, visits_count, bonus_balance, discount_percent, created_at, last_visit_at)
     VALUES ($1, $2, $3, $4, 1, 0, 0, NOW(), NOW())
     RETURNING *`,
    [id, customerCode, newReferralCode, referredById]
  );

  return insertRes.rows[0];
}

/**
 * Record successful completion of customer visit:
 * increments visit count, recalculates discount, awards referral bonus to referrer
 */
export async function recordVisitCompletion(customerId, queueId, referralCodeApplied, existingClient = null) {
  if (!customerId) return;

  const execute = async (client) => {
    // 1. Fetch customer
    const custRes = await client.query(
      `SELECT * FROM anonymous_customers WHERE id = $1 FOR UPDATE`,
      [customerId]
    );
    if (custRes.rows.length === 0) return;

    const customer = custRes.rows[0];
    const newVisits = customer.visits_count + 1;
    const newDiscount = calculateDiscount(newVisits);

    await client.query(
      `UPDATE anonymous_customers 
       SET visits_count = $1, discount_percent = $2, last_visit_at = NOW() 
       WHERE id = $3`,
      [newVisits, newDiscount, customerId]
    );

    await client.query(
      `INSERT INTO customer_bonus_logs (customer_id, queue_id, action, amount, details)
       VALUES ($1, $2, 'VISIT_COMPLETED', 0, $3)`,
      [customerId, queueId, `Tashriflar soni oshdi: ${newVisits} ta, joriy chegirma: ${newDiscount}%`]
    );

    // 2. If valid referral was applied, award referrer (anti-fraud: cannot refer self)
    if (referralCodeApplied && referralCodeApplied !== customer.referral_code) {
      const referrerRes = await client.query(
        `SELECT * FROM anonymous_customers WHERE referral_code = $1 FOR UPDATE`,
        [referralCodeApplied]
      );

      if (referrerRes.rows.length > 0 && referrerRes.rows[0].id !== customerId) {
        const referrer = referrerRes.rows[0];
        const BONUS_AMOUNT = 10000; // 10,000 UZS loyalty bonus

        const checkDuplicate = await client.query(
          `SELECT id FROM customer_bonus_logs WHERE customer_id = $1 AND queue_id = $2 AND action = 'REFERRAL_BONUS_EARNED'`,
          [referrer.id, queueId]
        );

        if (checkDuplicate.rows.length === 0) {
          await client.query(
            `UPDATE anonymous_customers 
             SET bonus_balance = bonus_balance + $1 
             WHERE id = $2`,
            [BONUS_AMOUNT, referrer.id]
          );

          await client.query(
            `INSERT INTO customer_bonus_logs (customer_id, queue_id, action, amount, details)
             VALUES ($1, $2, 'REFERRAL_BONUS_EARNED', $3, $4)`,
            [referrer.id, queueId, BONUS_AMOUNT, `Do‘stni taklif qilganlik uchun referral bonusi berildi`]
          );
        }
      }
    }
  };

  if (existingClient) {
    return await execute(existingClient);
  } else {
    return await withTransaction(execute);
  }
}
