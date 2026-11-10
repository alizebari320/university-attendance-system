import { Router } from 'express';
import * as ctrl from '../controllers/course.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER']));

router.get('/', ctrl.listCourses);
router.get('/:id', ctrl.getCourse);
router.post('/', ctrl.createCourse);
router.put('/:id', ctrl.updateCourse);
router.delete('/:id', ctrl.deleteCourse);

export default router;