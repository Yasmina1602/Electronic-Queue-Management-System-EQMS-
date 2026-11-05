import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../config/db.js';
import { updateStaffStatus, logAudit } from '../services/queueService.js';

export async function getStaffList(req, res, next) {
  try {
    const branchId = req.query.branchId || req.user?.branchId || 'branch-1';
    const result = await query(
      `SELECT e.*, array_agg(es.service_id) as authorized_service_ids 
       FROM employees e
       LEFT JOIN employee_services es ON e.id = es.employee_id
       WHERE e.branch_id = $1
       GROUP BY e.id
       ORDER BY e.window_number`,
      [branchId]
    );

    const staff = result.rows.map((s) => ({
      ...s,
      branchId: s.branch_id || 'branch-1',
      roleId: s.role_id,
      windowNumber: s.window_number,
      servedCountToday: s.served_count_today || 0,
      noShowCountToday: s.no_show_count_today || 0,
      totalServiceMinutes: s.total_service_minutes || 0,
      currentTicketId: s.current_ticket_id || null,
      pauseReason: s.pause_reason || null,
      authorizedServiceIds: (s.authorized_service_ids || []).filter(Boolean),
    }));

    res.json({ success: true, staff });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, pauseReason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Yangi holat ko‘rsatilmadi!' });
    }

    const result = await updateStaffStatus(id, status, pauseReason);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function addStaffMember(req, res, next) {
  try {
    const { name, login, password, roleId, phone, windowNumber, branchId, authorizedServiceIds } = req.body;
    if (!name || !login) {
      return res.status(400).json({ success: false, error: 'Ism va login kiritilishi shart!' });
    }

    const passwordHash = await bcrypt.hash(password || '123', 10);
    const resolvedRole = roleId === 'ADMIN' ? 'MANAGER' : (roleId || 'OPERATOR');
    const staffId = resolvedRole === 'MANAGER'
      ? `manager-${Date.now()}`
      : (resolvedRole === 'SUPERADMIN' ? `superadmin-${Date.now()}` : `staff-${Date.now()}`);

    const newStaff = await withTransaction(async (client) => {
      // Validate branch_id against branches table to prevent foreign key violation
      const branchCheck = await client.query(`SELECT id FROM branches WHERE id = $1`, [branchId || 'branch-1']);
      const validBranchId = branchCheck.rows.length > 0 ? branchCheck.rows[0].id : 'branch-1';

      const insRes = await client.query(
        `INSERT INTO employees 
          (id, branch_id, role_id, name, login, password_hash, phone, window_number, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'AVAILABLE', NOW())
         RETURNING *`,
        [staffId, validBranchId, resolvedRole, name.trim(), login.trim(), passwordHash, phone || null, windowNumber || '1']
      );

      const services = resolvedRole === 'OPERATOR' ? (authorizedServiceIds || ['srv-general', 'srv-accounting']) : [];
      if (resolvedRole === 'OPERATOR') {
        for (const srvId of services) {
          await client.query(
            `INSERT INTO employee_services (employee_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [staffId, srvId]
          );
        }
      }

      await logAudit(client, {
        branchId: validBranchId,
        action: 'STAFF_ADDED',
        details: `Yangi foydalanuvchi qo‘shildi: ${name} (${resolvedRole}, ${windowNumber}-oyna)`,
        staffId,
      });

      return {
        ...insRes.rows[0],
        branchId: insRes.rows[0].branch_id || 'branch-1',
        roleId: insRes.rows[0].role_id,
        windowNumber: insRes.rows[0].window_number,
        servedCountToday: 0,
        noShowCountToday: 0,
        totalServiceMinutes: 0,
        currentTicketId: null,
        pauseReason: null,
        authorizedServiceIds: services,
      };
    });

    res.status(201).json({ success: true, staff: newStaff });
  } catch (err) {
    next(err);
  }
}

export async function updateStaffMember(req, res, next) {
  try {
    const { id } = req.params;
    const { name, login, password, roleId, phone, windowNumber, branchId, authorizedServiceIds } = req.body;

    const existingRes = await query(`SELECT * FROM employees WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi!' });
    }
    const current = existingRes.rows[0];

    let passwordHash = current.password_hash;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await withTransaction(async (client) => {
      let validBranchId = current.branch_id;
      if (branchId !== undefined) {
        const branchCheck = await client.query(`SELECT id FROM branches WHERE id = $1`, [branchId]);
        validBranchId = branchCheck.rows.length > 0 ? branchCheck.rows[0].id : 'branch-1';
      }

      const resolvedRoleId = roleId === 'ADMIN' ? 'MANAGER' : (roleId !== undefined ? roleId : current.role_id);

      const updateRes = await client.query(
        `UPDATE employees
         SET name = COALESCE($1, name),
             login = COALESCE($2, login),
             password_hash = $3,
             role_id = COALESCE($4, role_id),
             phone = COALESCE($5, phone),
             window_number = COALESCE($6, window_number),
             branch_id = COALESCE($7, branch_id)
         WHERE id = $8
         RETURNING *`,
        [
          name !== undefined ? name.trim() : current.name,
          login !== undefined ? login.trim() : current.login,
          passwordHash,
          resolvedRoleId,
          phone !== undefined ? phone : current.phone,
          windowNumber !== undefined ? windowNumber : current.window_number,
          validBranchId,
          id,
        ]
      );

      if (resolvedRoleId !== 'OPERATOR') {
        await client.query(`DELETE FROM employee_services WHERE employee_id = $1`, [id]);
      } else if (authorizedServiceIds && Array.isArray(authorizedServiceIds)) {
        await client.query(`DELETE FROM employee_services WHERE employee_id = $1`, [id]);
        for (const srvId of authorizedServiceIds) {
          await client.query(
            `INSERT INTO employee_services (employee_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, srvId]
          );
        }
      }

      await logAudit(client, {
        branchId: branchId || current.branch_id || 'branch-1',
        action: 'STAFF_UPDATED',
        details: `Foydalanuvchi tahrirlandi: ${name || current.name} (${roleId || current.role_id})`,
        staffId: id,
      });

      const s = updateRes.rows[0];
      return {
        ...s,
        branchId: s.branch_id || 'branch-1',
        roleId: s.role_id,
        windowNumber: s.window_number,
        servedCountToday: s.served_count_today || 0,
        noShowCountToday: s.no_show_count_today || 0,
        totalServiceMinutes: s.total_service_minutes || 0,
        currentTicketId: s.current_ticket_id || null,
        pauseReason: s.pause_reason || null,
        authorizedServiceIds: authorizedServiceIds || current.authorized_service_ids || [],
      };
    });

    res.json({ success: true, staff: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteStaffMember(req, res, next) {
  try {
    const { id } = req.params;
    await query(`DELETE FROM employees WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Xodim tizimdan o‘chirildi.' });
  } catch (err) {
    next(err);
  }
}

export async function getStaffRequests(req, res, next) {
  try {
    const result = await query(
      `SELECT * FROM staff_requests WHERE status = 'PENDING' ORDER BY created_at DESC`
    );
    res.json({ success: true, requests: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function approveStaffRequest(req, res, next) {
  try {
    const { id } = req.params;

    const newStaff = await withTransaction(async (client) => {
      const reqRes = await client.query(`SELECT * FROM staff_requests WHERE id = $1 FOR UPDATE`, [id]);
      if (reqRes.rows.length === 0) throw new Error('Ariza topilmadi!');

      const request = reqRes.rows[0];
      const staffId = `staff-${Date.now()}`;

      const staffRes = await client.query(
        `INSERT INTO employees 
          (id, branch_id, role_id, name, login, password_hash, phone, window_number, status, created_at)
         VALUES ($1, $2, 'OPERATOR', $3, $4, $5, $6, $7, 'AVAILABLE', NOW())
         RETURNING *`,
        [staffId, request.branch_id, request.name, request.login, request.password_hash, request.phone, request.window_number]
      );

      // Default services: both general and accounting
      await client.query(
        `INSERT INTO employee_services (employee_id, service_id) VALUES ($1, 'srv-general'), ($1, 'srv-accounting') ON CONFLICT DO NOTHING`,
        [staffId]
      );

      await client.query(`UPDATE staff_requests SET status = 'APPROVED' WHERE id = $1`, [id]);

      await logAudit(client, {
        branchId: request.branch_id,
        action: 'STAFF_APPROVED',
        details: `Admin arizani tasdiqladi va yangi xodim qo‘shildi: ${request.name}`,
        staffId,
      });

      return staffRes.rows[0];
    });

    res.json({ success: true, staff: newStaff });
  } catch (err) {
    next(err);
  }
}

export async function rejectStaffRequest(req, res, next) {
  try {
    const { id } = req.params;
    await query(`UPDATE staff_requests SET status = 'REJECTED' WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Ariza rad etildi.' });
  } catch (err) {
    next(err);
  }
}

