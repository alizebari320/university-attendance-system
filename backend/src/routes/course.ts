import { Router } from 'express';
import * as ctrl from '../controllers/course.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Read access for every authenticated role (students see course catalogue)
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER', 'STUDENT']), ctrl.listCourses);
router.get('/:id', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER', 'STUDENT']), ctrl.getCourse);

// Mutations restricted to management roles
router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN']));
router.post('/', ctrl.createCourse);
router.put('/:id', ctrl.updateCourse);
router.delete('/:id', ctrl.deleteCourse);

export default router;
