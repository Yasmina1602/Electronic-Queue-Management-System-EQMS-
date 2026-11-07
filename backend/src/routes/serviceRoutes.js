import { Router } from 'express';
import { getServices, createService, updateService, toggleServiceActive, deleteService } from '../controllers/serviceController.js';

const router = Router();

router.get('/', getServices);
router.post('/', createService);
router.put('/:id', updateService);
router.patch('/:id/toggle', toggleServiceActive);
router.delete('/:id', deleteService);

export default router;

