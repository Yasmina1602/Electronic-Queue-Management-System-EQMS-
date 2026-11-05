import { query, withTransaction } from '../config/db.js';
import { runSeed } from '../database/seed.js';
import { emitBranchEvent } from '../services/socketService.js';

export async function getAuditLogs(req, res, next) {
  try {
    const branchId = req.query.branchId || 'branch-1';
    const limit = parseInt(req.query.limit, 10) || 50;
    const result = await query(
      `SELECT * FROM audit_logs WHERE branch_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [branchId, limit]
    );
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req, res, next) {
  try {
    const result = await query(`SELECT * FROM system_settings`);
    const settingsMap = {};
    result.rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });
    res.json({ success: true, settings: settingsMap });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, error: 'Kalit va qiymat kiritilishi shart!' });
    }

    const result = await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value)]
    );

    res.json({ success: true, setting: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function resetDemo(req, res, next) {
  try {
    await runSeed();
    emitBranchEvent('branch-1', 'state:reset', {});
    res.json({ success: true, message: 'Tizim boshlang‘ich demo holatiga qaytarildi!' });
  } catch (err) {
    next(err);
  }
}

export async function clearQueue(req, res, next) {
  try {
    const branchId = req.body.branchId || 'branch-1';

    await withTransaction(async (client) => {
      await client.query(`DELETE FROM queues WHERE branch_id = $1 AND created_date = CURRENT_DATE`, [branchId]);
      await client.query(
        `UPDATE employees 
         SET status = 'AVAILABLE', current_ticket_id = NULL, no_show_count_today = 0
         WHERE branch_id = $1`,
        [branchId]
      );
    });

    emitBranchEvent(branchId, 'queue:cleared', {});
    res.json({ success: true, message: 'Bugungi navbatlar tozalandi!' });
  } catch (err) {
    next(err);
  }
}

