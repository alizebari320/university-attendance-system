import { Router } from 'express';
import * as ctrl from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER', 'STUDENT']));

router.get('/daily', ctrl.dailyReport);
router.get('/weekly', ctrl.weeklyReport);
router.get('/monthly', ctrl.monthlyReport);
router.get('/semester', ctrl.semesterReport);
router.get('/export', ctrl.exportReport);

export default router;