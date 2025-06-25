import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { validateRegister, validateLogin } from '../middleware/validation';
import { User, ApiResponse } from '../types';

const router = Router();

router.post('/register', validateRegister, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { username, email, password } = req.body;

    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email or username already exists'
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)',
      [userId, username, email, hashedPassword]
    );

    const user = await queryOne<User>(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    const token = jwt.sign(
      { id: user!.id, username: user!.username, email: user!.email },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user!.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user!.id,
          username: user!.username,
          email: user!.email,
          createdAt: user!.createdAt
        },
        token,
        refreshToken
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/login', validateLogin, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    const user = await queryOne<User>(
      'SELECT id, username, email, password FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token,
        refreshToken
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    
    const user = await queryOne<User>(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
      return;
    }

    const newToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    res.json({
      success: true,
      data: { token: newToken }
    } as ApiResponse);

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

export default router;