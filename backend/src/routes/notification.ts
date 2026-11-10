import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER', 'STUDENT']));

router.get('/', ctrl.listNotifications);
router.get('/recipients', authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER']), ctrl.listRecipients);
router.put('/read-all', ctrl.markAllNotificationsRead);
router.put('/:id/read', ctrl.markNotificationRead);
router.post('/announcement', authorize(['SUPER_ADMIN', 'DOCTOR', 'LECTURER']), ctrl.createAnnouncement);

export default router;