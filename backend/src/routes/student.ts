import { Router } from 'express';
import * as ctrl from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN']));

router.get('/', ctrl.listStudents);
router.post('/', ctrl.createStudent);

export default router;