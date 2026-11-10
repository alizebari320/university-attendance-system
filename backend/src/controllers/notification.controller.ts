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

    const notifications = userIds.map((userId: string) => ({
      userId,
      type: 'LECTURER_ANNOUNCEMENT',
      title,
      message,
      authorId: actorId,
      relatedEntityType: 'Announcement',
    }));

    await prisma.notification.createMany({ data: notifications });
    res.status(201).json({ success: true, message: 'Announcement sent' });
  } catch (error) { next(error); }
};