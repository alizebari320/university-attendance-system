import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  collegeId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const listDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { collegeId } = req.query;
    const departments = await prisma.department.findMany({
      where: collegeId ? { collegeId: String(collegeId) } : {},
      include: { college: true, courses: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
};

export const getDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { college: true, courses: true },
    });
    if (!dept) { res.status(404).json({ success: false, error: 'Department not found' }); return; }
    res.json({ success: true, data: dept });
  } catch (error) { next(error); }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = departmentSchema.parse(req.body);
    const dept = await prisma.department.create({ data });
    res.status(201).json({ success: true, data: dept });
  } catch (error) { next(error); }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = departmentSchema.partial().parse(req.body);
    const dept = await prisma.department.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: dept });
  } catch (error) { next(error); }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) { next(error); }
};