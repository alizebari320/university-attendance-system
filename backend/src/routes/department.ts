import { Router } from 'express';
import * as ctrl from '../controllers/department.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN']));

router.get('/', ctrl.listDepartments);
router.get('/:id', ctrl.getDepartment);
router.post('/', ctrl.createDepartment);
router.put('/:id', ctrl.updateDepartment);
router.delete('/:id', ctrl.deleteDepartment);

export default router;