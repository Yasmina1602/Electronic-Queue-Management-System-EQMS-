import { Router } from 'express';
import {
  getAuditLogs,
  getSettings,
  updateSettings,
  resetDemo,
  clearQueue,
} from '../controllers/adminController.js';

const router = Router();

router.get('/audit-logs', getAuditLogs);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/reset-demo', resetDemo);
router.post('/clear-queue', clearQueue);

export default router;

