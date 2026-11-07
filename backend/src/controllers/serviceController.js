import { query } from '../config/db.js';
import { getIO } from '../services/socketService.js';

export async function getServices(req, res, next) {
  try {
    const result = await query(`SELECT * FROM services ORDER BY display_order ASC, priority_weight DESC, name ASC`);
    res.json({ success: true, services: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function createService(req, res, next) {
  try {
    const { name, description, prefix, avgDurationMin, icon, priorityWeight, category } = req.body;
    const displayOrder = req.body.displayOrder !== undefined ? req.body.displayOrder : (req.body.display_order || 1);
    if (!name || !prefix) {
      return res.status(400).json({ success: false, error: 'Xizmat nomi va prefiksi shart!' });
    }

    const id = `srv-${Date.now()}`;
    const result = await query(
      `INSERT INTO services 
        (id, name, description, prefix, avg_duration_min, icon, priority_weight, category, active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
       RETURNING *`,
      [id, name.trim(), description, prefix.trim().toUpperCase(), avgDurationMin || 10, icon || 'Layers', priorityWeight || 1, category || 'general', displayOrder]
    );

    const io = getIO();
    if (io) {
      io.emit('service:updated', result.rows[0]);
    }

    res.status(201).json({ success: true, service: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, prefix, icon, priorityWeight, category, active } = req.body;
    const avgDuration = req.body.avgDurationMin !== undefined ? req.body.avgDurationMin : req.body.avg_duration_min;
    const displayOrder = req.body.displayOrder !== undefined ? req.body.displayOrder : req.body.display_order;

    const result = await query(
      `UPDATE services 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           prefix = COALESCE($3, prefix),
           avg_duration_min = COALESCE($4, avg_duration_min),
           icon = COALESCE($5, icon),
           priority_weight = COALESCE($6, priority_weight),
           category = COALESCE($7, category),
           active = COALESCE($8, active),
           display_order = COALESCE($9, display_order)
       WHERE id = $10
       RETURNING *`,
      [
        name ? name.trim() : null,
        description !== undefined ? description : null,
        prefix ? prefix.trim().toUpperCase() : null,
        avgDuration !== undefined ? avgDuration : null,
        icon !== undefined ? icon : null,
        priorityWeight !== undefined ? priorityWeight : null,
        category !== undefined ? category : null,
        active !== undefined ? active : null,
        displayOrder !== undefined ? displayOrder : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Xizmat turi topilmadi!' });
    }

    const io = getIO();
    if (io) {
      io.emit('service:updated', result.rows[0]);
    }

    res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function toggleServiceActive(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE services SET active = NOT active WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Xizmat topilmadi!' });
    }

    const io = getIO();
    if (io) {
      io.emit('service:updated', result.rows[0]);
    }

    res.json({ success: true, service: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req, res, next) {
  try {
    const { id } = req.params;

    // Remove foreign references before deleting service
    await query(`DELETE FROM employee_services WHERE service_id = $1`, [id]);
    await query(`DELETE FROM queues WHERE service_id = $1`, [id]);
    await query(`DELETE FROM daily_sequences WHERE service_id = $1`, [id]);

    const result = await query(`DELETE FROM services WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bo‘lim topilmadi!' });
    }

    const io = getIO();
    if (io) {
      io.emit('service:deleted', { id });
    }

    res.json({ success: true, message: 'Bo‘lim muvaffaqiyatli o‘chirildi', id });
  } catch (err) {
    next(err);
  }
}
