import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notificationId = req.params.id;
    const userId = (req as any).user.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};

export const createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, userIds } = req.body;
    const actorId = (req as any).user.id;
    const actorRole = (req as any).user.role;

    if (!title || !message) {
      res.status(400).json({ success: false, error: 'Title and message are required' });
      return;
    }

    let recipientIds: string[] = Array.isArray(userIds) ? userIds : [];

    if (recipientIds.length === 0) {
      const where: any = { status: 'ACTIVE' };
      if (actorRole === 'LECTURER') {
        const lecturer = await prisma.lecturerProfile.findUnique({ where: { userId: actorId } });
        where.departmentId = lecturer ? lecturer.departmentId : '__none__';
      }
      const students = await prisma.studentProfile.findMany({ where, select: { userId: true } });
      recipientIds = students.map(s => s.userId);
    }

    if (recipientIds.length === 0) {
      res.status(400).json({ success: false, error: 'No recipients found' });
      return;
    }

    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: 'LECTURER_ANNOUNCEMENT' as const,
        title,
        message,
        authorId: actorId,
        relatedEntityType: 'Announcement',
      })),
    });

    res.status(201).json({ success: true, data: { sent: recipientIds.length } });
  } catch (error) { next(error); }
};

export const listRecipients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const actorId = (req as any).user.id;
    const actorRole = (req as any).user.role;
    const where: any = { status: 'ACTIVE' };

    if (actorRole === 'LECTURER') {
      const lecturer = await prisma.lecturerProfile.findUnique({ where: { userId: actorId } });
      where.departmentId = lecturer ? lecturer.departmentId : '__none__';
    } else if (actorRole === 'DEPARTMENT_ADMIN') {
      const admin = await prisma.departmentAdminProfile.findUnique({ where: { userId: actorId } });
      where.departmentId = admin ? admin.departmentId : '__none__';
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: { user: { select: { id: true, email: true } }, department: true },
      orderBy: { studentNumber: 'asc' },
    });

    res.json({
      success: true,
      data: students.map(s => ({
        userId: s.userId,
        email: s.user.email,
        studentNumber: s.studentNumber,
        department: s.department.name,
      })),
    });
  } catch (error) { next(error); }
};