import { Router } from 'express';
import {
  getStaffList,
  handleUpdateStatus,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  getStaffRequests,
  approveStaffRequest,
  rejectStaffRequest,
} from '../controllers/staffController.js';

const router = Router();

router.get('/', getStaffList);
router.put('/:id/status', handleUpdateStatus);
router.put('/:id', updateStaffMember);
router.post('/', addStaffMember);
router.delete('/:id', deleteStaffMember);

router.get('/requests', getStaffRequests);
router.post('/requests/:id/approve', approveStaffRequest);
router.post('/requests/:id/reject', rejectStaffRequest);

export default router;

