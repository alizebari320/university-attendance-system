import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AuditAction } from '@prisma/client';
import type { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

interface AuditContext {
  entityType: string;
  entityId: string;
  action: AuditAction;
  reason?: string;
}

export const auditLog = (context: AuditContext) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any as AuthenticatedRequest).user;
    const originalSend = res.send;

    res.send = function(body: string | object) {
      const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
      
      // Log successful operations
      if (responseBody?.success !== false && context.entityId) {
        prisma.auditLog.create({
          data: {
            entityType: context.entityType,
            entityId: context.entityId,
            action: context.action,
            actorId: user?.id,
            actorRole: user?.role,
            oldValues: (req as any).oldValues || {},
            newValues: responseBody?.data || {},
            reason: context.reason,
            ipAddress: (req as any as AuthenticatedRequest).ipAddress,
            userAgent: (req as any as AuthenticatedRequest).userAgent,
          },
        }).catch(console.error);
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

// High-level audit logging for CRUD operations
export const logAudit = async (
  entityType: string,
  entityId: string,
  action: AuditAction,
  userId?: string,
  role?: string,
  oldValues?: any,
  newValues?: any,
  reason?: string,
  req?: Request
) => {
  return prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actorId: userId,
      actorRole: role as any,
      oldValues,
      newValues,
      reason,
      ipAddress: (req as any)?.ipAddress,
      userAgent: (req as any)?.userAgent,
    },
  });
};