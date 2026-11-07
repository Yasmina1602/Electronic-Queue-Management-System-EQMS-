import crypto from 'crypto';
import { pool, query, withTransaction } from '../config/db.js';

/**
 * Generate secure anonymous token
 */
export function generateAnonymousCode(prefix = 'QR') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Calculate discount based on visits count
 * 3 visits -> 5%, 5 visits -> 10%, 10 visits -> 15%
 */
export function calculateDiscount(visitsCount) {
  if (visitsCount >= 10) return 15;
  if (visitsCount >= 5) return 10;
  if (visitsCount >= 3) return 5;
  return 0;
}

/**
 * Find or create an anonymous customer profile
 * Absolutely NO personally identifiable information is stored
 */
export async function getOrCreateAnonymousCustomer(providedCode = null, referralCode = null, existingClient = null) {
  const runner = existingClient || pool;

  if (providedCode) {
    const existing = await runner.query(
      `SELECT * FROM anonymous_customers WHERE customer_code = $1`,
      [providedCode]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
  }

  // Create new anonymous customer
  const id = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const customerCode = providedCode || generateAnonymousCode('CUST');
  const newReferralCode = generateAnonymousCode('REF');

  let referredById = null;
  if (referralCode && referralCode !== newReferralCode) {
    const referrerRes = await runner.query(
      `SELECT id FROM anonymous_customers WHERE referral_code = $1`,
      [referralCode]
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
