import { Router } from 'express';
import { getServices, createService, updateService, toggleServiceActive } from '../controllers/serviceController.js';

const router = Router();

router.get('/', getServices);
router.post('/', createService);
router.put('/:id', updateService);
router.patch('/:id/toggle', toggleServiceActive);

export default router;

