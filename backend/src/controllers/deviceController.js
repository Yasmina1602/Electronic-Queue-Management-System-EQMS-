import { query } from '../config/db.js';
import { logAudit } from '../services/queueService.js';

export async function getDevices(req, res, next) {
  try {
    const branchId = req.query.branchId || 'branch-1';
    const result = await query(`SELECT * FROM devices WHERE branch_id = $1 ORDER BY name`, [branchId]);
    res.json({ success: true, devices: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function createDevice(req, res, next) {
  try {
    const { name, ipAddress, type, branchId } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Qurilma nomi va turi kiritilishi shart!' });
    }

    const id = `dev-${Date.now()}`;
    const result = await query(
      `INSERT INTO devices (id, branch_id, name, ip_address, type, status, last_ping, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ONLINE', NOW(), NOW())
       RETURNING *`,
      [id, branchId || 'branch-1', name.trim(), ipAddress || '192.168.1.1', type]
    );

    res.status(201).json({ success: true, device: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function restartDevice(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE devices SET status = 'ONLINE', last_ping = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Qurilma topilmadi!' });
    }

    await logAudit(null, {
      branchId: result.rows[0].branch_id,
      action: 'DEVICE_RESTARTED',
      details: `${result.rows[0].name} (${result.rows[0].type}) qayta ishga tushirildi`,
    });

    res.json({ success: true, message: 'Qurilma qayta ishga tushirildi.', device: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function toggleDeviceStatus(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE devices 
       SET status = CASE WHEN status = 'ONLINE' THEN 'OFFLINE' ELSE 'ONLINE' END,
           last_ping = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Qurilma topilmadi!' });
    }

    res.json({ success: true, device: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteDevice(req, res, next) {
  try {
    const { id } = req.params;
    await query(`DELETE FROM devices WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Qurilma o‘chirildi.' });
  } catch (err) {
    next(err);
  }
}

