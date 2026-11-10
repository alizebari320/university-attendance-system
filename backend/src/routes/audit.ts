import { Router } from 'express';
import * as ctrl from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR']));

router.get('/', ctrl.listAuditLogs);
router.get('/trail/:entityType/:entityId', ctrl.getAuditTrail);

export default router;