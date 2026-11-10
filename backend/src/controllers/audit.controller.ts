import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entityType, action, actorId, limit = 100, offset = 0 } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType: String(entityType) } : {}),
        ...(action ? { action: action as any } : {}),
        ...(actorId ? { actorId: String(actorId) } : {}),
      },
      include: { actor: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

export const getAuditTrail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;
    const logs = await prisma.auditLog.findMany({
      where: { entityType: String(entityType), entityId: String(entityId) },
      include: { actor: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};