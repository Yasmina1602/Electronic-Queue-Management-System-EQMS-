import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export function generateToken(payload) {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '24h' });
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Autentifikatsiya talab qilinadi!' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Noto‘g‘ri yoki muddati o‘tgan token!' });
  }
}

/**
 * Role-Based Access Control
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiya qilinmagan!' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Ruxsat berilmagan! Sizning rolingiz (${req.user.role}) bu amalni bajarish vakolatiga ega emas.`,
      });
    }

    next();
  };
}

/**
 * Branch tenancy check: Operator/Manager can only modify their own branch unless ADMIN
 */
export function requireBranchAccess(branchIdParamKey = 'branchId') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Autentifikatsiya kerak!' });
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN') return next();

    const targetBranchId = req.params[branchIdParamKey] || req.body[branchIdParamKey] || req.query[branchIdParamKey];
    if (targetBranchId && req.user.branchId && targetBranchId !== req.user.branchId) {
      return res.status(403).json({
        success: false,
        error: 'Siz boshqa filial ma’lumotlariga ruxsatga ega emassiz!',
      });
    }
    next();
  };
}

