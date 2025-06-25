import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, transaction } from '../config/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateCreateWorldCup, validateWorldCupId, validatePagination } from '../middleware/validation';
import { AuthRequest, WorldCup, WorldCupItem, CreateWorldCupRequest, ApiResponse, PaginatedResponse } from '../types';

const router = Router();

router.get('/', validatePagination, optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const sortBy = req.query.sortBy as string || 'created_at';
    const search = req.query.search as string;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_public = true';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (category && category !== 'all') {
      paramCount++;
      whereClause += ` AND category = $${paramCount}`;
      queryParams.push(category);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    let orderClause = 'ORDER BY created_at DESC';
    switch (sortBy) {
      case 'popular':
        orderClause = 'ORDER BY participants DESC, likes DESC';
        break;
      case 'recent':
        orderClause = 'ORDER BY created_at DESC';
        break;
      case 'views':
        orderClause = 'ORDER BY views DESC';
        break;
      case 'comments':
        orderClause = 'ORDER BY comments DESC';
        break;
    }

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM worldcups w
      JOIN users u ON w.author_id = u.id 
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        w.id, w.title, w.description, w.thumbnail, w.category, w.created_at,
        w.views, w.participants, w.likes, w.comments,
        u.username as author
      FROM worldcups w
      JOIN users u ON w.author_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const [totalResult, worldcups] = await Promise.all([
      queryOne<{ total: string }>(countQuery, queryParams),
      query<WorldCup & { author: string }>(dataQuery, [...queryParams, limit, offset])
    ]);

    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: worldcups,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    } as PaginatedResponse<WorldCup & { author: string }>);

  } catch (error) {
    console.error('Get worldcups error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/:id', validateWorldCupId, optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const worldcup = await queryOne<WorldCup & { author: string }>(
      `SELECT 
        w.id, w.title, w.description, w.thumbnail, w.category, w.created_at,
        w.views, w.participants, w.likes, w.comments, w.is_public,
        u.username as author, u.id as author_id
      FROM worldcups w
      JOIN users u ON w.author_id = u.id
      WHERE w.id = $1`,
      [id]
    );

    if (!worldcup) {
      return res.status(404).json({
        success: false,
        error: 'World cup not found'
      });
    }

    if (!worldcup.is_public && (!req.user || req.user.id !== worldcup.author_id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await query('UPDATE worldcups SET views = views + 1 WHERE id = $1', [id]);

    const items = await query<WorldCupItem>(
      'SELECT id, title, description, image, order_num FROM worldcup_items WHERE worldcup_id = $1 ORDER BY order_num',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...worldcup,
        items
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get worldcup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/', authenticateToken, validateCreateWorldCup, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, description, category, items, isPublic = true }: CreateWorldCupRequest = req.body;
    const userId = req.user!.id;

    const worldcupId = uuidv4();

    await transaction(async (transQuery) => {
      await transQuery(
        `INSERT INTO worldcups (id, title, description, category, author_id, is_public)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [worldcupId, title, description, category, userId, isPublic]
      );

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = uuidv4();
        await transQuery(
          `INSERT INTO worldcup_items (id, worldcup_id, title, description, image, order_num)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [itemId, worldcupId, item.title, item.description, item.image, i + 1]
        );
      }
    });

    const newWorldcup = await queryOne<WorldCup & { author: string }>(
      `SELECT 
        w.id, w.title, w.description, w.category, w.created_at, w.is_public,
        u.username as author
      FROM worldcups w
      JOIN users u ON w.author_id = u.id
      WHERE w.id = $1`,
      [worldcupId]
    );

    res.status(201).json({
      success: true,
      data: newWorldcup
    } as ApiResponse);

  } catch (error) {
    console.error('Create worldcup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/:id/like', authenticateToken, validateWorldCupId, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingLike = await queryOne(
      'SELECT id FROM likes WHERE worldcup_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingLike) {
      await query('DELETE FROM likes WHERE worldcup_id = $1 AND user_id = $2', [id, userId]);
      await query('UPDATE worldcups SET likes = likes - 1 WHERE id = $1', [id]);
      res.json({ success: true, data: { liked: false } });
    } else {
      const likeId = uuidv4();
      await query(
        'INSERT INTO likes (id, worldcup_id, user_id) VALUES ($1, $2, $3)',
        [likeId, id, userId]
      );
      await query('UPDATE worldcups SET likes = likes + 1 WHERE id = $1', [id]);
      res.json({ success: true, data: { liked: true } });
    }

  } catch (error) {
    console.error('Like worldcup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;