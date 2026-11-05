import { Router } from 'express';
import { getAnalytics, exportExcelReport, exportCsvReport, exportPdfReport } from '../controllers/reportController.js';

const router = Router();

router.get('/analytics', getAnalytics);
router.get('/export/excel', exportExcelReport);
router.get('/export/csv', exportCsvReport);
router.get('/export/pdf', exportPdfReport);

export default router;

