import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listFraudLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { detectionType, severity, resolved } = req.query;
    const logs = await prisma.fraudDetectionLog.findMany({
      where: {
        ...(detectionType ? { detectionType: detectionType as any } : {}),
        ...(severity ? { severity: severity as any } : {}),
        ...(resolved !== undefined ? { resolved: resolved === 'true' } : {}),
      },
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

export const resolveFraud = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fraudId = req.params.id;
    const resolvedBy = (req as any).user.id;

    const updated = await prisma.fraudDetectionLog.update({
      where: { id: fraudId },
      data: { resolved: true, resolvedBy, resolvedAt: new Date() },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};