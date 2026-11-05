import { query } from '../config/db.js';

export async function getBranches(req, res, next) {
  try {
    const result = await query(`SELECT * FROM branches ORDER BY name`);
    res.json({ success: true, branches: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function createBranch(req, res, next) {
  try {
    const { name, code, address, phone } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Filial nomi va kodi kiritilishi shart!' });
    }

    const id = `branch-${Date.now()}`;
    const result = await query(
      `INSERT INTO branches (id, name, code, address, phone, active) 
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING *`,
      [id, name.trim(), code.trim().toUpperCase(), address, phone]
    );

    res.status(201).json({ success: true, branch: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateBranch(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, address, phone, active } = req.body;

    const result = await query(
      `UPDATE branches 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           address = COALESCE($3, address),
           phone = COALESCE($4, phone),
           active = COALESCE($5, active)
       WHERE id = $6
       RETURNING *`,
      [name, code ? code.toUpperCase() : null, address, phone, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Filial topilmadi!' });
    }

    res.json({ success: true, branch: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteBranch(req, res, next) {
  try {
    const { id } = req.params;
    await query(`UPDATE branches SET active = false WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Filial faoliyati to‘xtatildi.' });
  } catch (err) {
    next(err);
  }
}

