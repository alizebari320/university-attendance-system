import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import type { JwtPayload, UserRole } from '../types';

const prisma = new PrismaClient();

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN: string = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.accessToken || 
                req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Authentication token required' 
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || user.status !== 'ACTIVE') {
    res.status(401).json({ 
      success: false, 
      error: 'User not found or inactive' 
    });
    return;
  }

  (req as any).user = {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    status: user.status,
  };
  (req as any).ipAddress = req.ip || '';
  (req as any).userAgent = req.get('User-Agent') || '';

  next();
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
      return;
    }

    next();
  };
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, rememberMe } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(401).json({ 
        success: false, 
        error: 'Account temporarily locked. Try again later.' 
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: user.failedLoginAttempts + 1,
        },
      });

      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
      return;
    }

    const refreshToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: rememberMe ? REFRESH_TOKEN_EXPIRES_IN : '1h' } as jwt.SignOptions
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      res.status(401).json({ 
        success: false, 
        error: 'Refresh token required' 
      });
      return;
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
      return;
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};