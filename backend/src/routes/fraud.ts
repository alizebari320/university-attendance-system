import { Router } from 'express';
import * as ctrl from '../controllers/fraud.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR']));

router.get('/', ctrl.listFraudLogs);
router.put('/:id/resolve', ctrl.resolveFraud);

export default router;