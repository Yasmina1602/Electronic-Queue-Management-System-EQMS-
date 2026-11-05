import { Router } from 'express';
import {
  getDevices,
  createDevice,
  restartDevice,
  toggleDeviceStatus,
  deleteDevice,
} from '../controllers/deviceController.js';

const router = Router();

router.get('/', getDevices);
router.post('/', createDevice);
router.post('/:id/restart', restartDevice);
router.patch('/:id/status', toggleDeviceStatus);
router.delete('/:id', deleteDevice);

export default router;

