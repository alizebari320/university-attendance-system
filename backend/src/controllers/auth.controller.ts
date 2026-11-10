import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      include: {
        studentProfile: { include: { college: true, department: true } },
        lecturerProfile: { include: { college: true, department: true } },
        departmentAdminProfile: { include: { college: true, department: true } },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.studentProfile || user.lecturerProfile || user.departmentAdminProfile,
      },
    });
  } catch (error) { next(error); }
};