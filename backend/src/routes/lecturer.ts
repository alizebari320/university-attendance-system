import { Router } from 'express';
import * as ctrl from '../controllers/lecturer.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN']));

router.get('/', ctrl.listLecturers);
router.post('/', ctrl.createLecturer);

export default router;