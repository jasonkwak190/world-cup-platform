import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, transaction } from '../config/database';
import { optionalAuth } from '../middleware/auth';
import { validateWorldCupId } from '../middleware/validation';
import { AuthRequest, Tournament, TournamentMatch, WorldCupItem, ApiResponse } from '../types';

const router = Router();

function calculateTotalRounds(itemCount: number): number {
  return Math.ceil(Math.log2(itemCount));
}

function getNextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

router.post('/:id/start', validateWorldCupId, optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id: worldcupId } = req.params;
    const userId = req.user?.id;

    const worldcup = await queryOne(
      'SELECT id, title FROM worldcups WHERE id = $1 AND is_public = true',
      [worldcupId]
    );

    if (!worldcup) {
      return res.status(404).json({
        success: false,
        error: 'World cup not found'
      });
    }

    const items = await query<WorldCupItem>(
      'SELECT id, title, description, image FROM worldcup_items WHERE worldcup_id = $1 ORDER BY order_num',
      [worldcupId]
    );

    if (items.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'World cup must have at least 4 items'
      });
    }

    const shuffledItems = shuffleArray(items);
    const totalRounds = calculateTotalRounds(items.length);
    const tournamentId = uuidv4();

    await transaction(async (transQuery) => {
      await transQuery(
        `INSERT INTO tournaments (id, worldcup_id, user_id, current_round, total_rounds)
         VALUES ($1, $2, $3, $4, $5)`,
        [tournamentId, worldcupId, userId, 1, totalRounds]
      );

      let matchNumber = 1;
      for (let i = 0; i < shuffledItems.length; i += 2) {
        if (i + 1 < shuffledItems.length) {
          const matchId = uuidv4();
          await transQuery(
            `INSERT INTO tournament_matches (id, tournament_id, round, match_number, item1_id, item2_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [matchId, tournamentId, 1, matchNumber, shuffledItems[i].id, shuffledItems[i + 1].id]
          );
          matchNumber++;
        }
      }
    });

    const tournament = await queryOne<Tournament>(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    const matches = await query<TournamentMatch & { item1: WorldCupItem; item2: WorldCupItem }>(
      `SELECT 
        tm.id, tm.round, tm.match_number, tm.winner_id, tm.completed_at,
        i1.id as item1_id, i1.title as item1_title, i1.description as item1_description, i1.image as item1_image,
        i2.id as item2_id, i2.title as item2_title, i2.description as item2_description, i2.image as item2_image
      FROM tournament_matches tm
      JOIN worldcup_items i1 ON tm.item1_id = i1.id
      JOIN worldcup_items i2 ON tm.item2_id = i2.id
      WHERE tm.tournament_id = $1 AND tm.round = 1
      ORDER BY tm.match_number`,
      [tournamentId]
    );

    const formattedMatches = matches.map(match => ({
      id: match.id,
      round: match.round,
      matchNumber: match.match_number,
      winnerId: match.winner_id,
      completedAt: match.completed_at,
      item1: {
        id: match.item1_id,
        title: match.item1_title,
        description: match.item1_description,
        image: match.item1_image
      },
      item2: {
        id: match.item2_id,
        title: match.item2_title,
        description: match.item2_description,
        image: match.item2_image
      }
    }));

    res.status(201).json({
      success: true,
      data: {
        tournament,
        matches: formattedMatches,
        currentMatch: formattedMatches.find(m => !m.winnerId) || null
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Start tournament error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/:tournamentId/matches/:matchId/winner', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tournamentId, matchId } = req.params;
    const { winnerId } = req.body;

    if (!winnerId) {
      return res.status(400).json({
        success: false,
        error: 'Winner ID is required'
      });
    }

    const tournament = await queryOne<Tournament>(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const match = await queryOne<TournamentMatch>(
      'SELECT * FROM tournament_matches WHERE id = $1 AND tournament_id = $2',
      [matchId, tournamentId]
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    if (match.winnerId) {
      return res.status(400).json({
        success: false,
        error: 'Match already completed'
      });
    }

    if (winnerId !== match.item1Id && winnerId !== match.item2Id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid winner ID'
      });
    }

    await query(
      'UPDATE tournament_matches SET winner_id = $1, completed_at = NOW() WHERE id = $2',
      [winnerId, matchId]
    );

    const currentRoundMatches = await query<TournamentMatch>(
      'SELECT * FROM tournament_matches WHERE tournament_id = $1 AND round = $2',
      [tournamentId, tournament.currentRound]
    );

    const completedMatches = currentRoundMatches.filter(m => m.winnerId || m.id === matchId);
    
    if (completedMatches.length === currentRoundMatches.length) {
      if (tournament.currentRound === tournament.totalRounds) {
        await query(
          'UPDATE tournaments SET winner_id = $1, completed_at = NOW() WHERE id = $2',
          [winnerId, tournamentId]
        );
        
        await query(
          'UPDATE worldcups SET participants = participants + 1 WHERE id = $1',
          [tournament.worldCupId]
        );
      } else {
        const winners = await query<{ winnerId: string; matchNumber: number }>(
          `SELECT winner_id as "winnerId", match_number as "matchNumber" 
           FROM tournament_matches 
           WHERE tournament_id = $1 AND round = $2 
           ORDER BY match_number`,
          [tournamentId, tournament.currentRound]
        );

        const nextRound = tournament.currentRound + 1;
        await query(
          'UPDATE tournaments SET current_round = $1 WHERE id = $2',
          [nextRound, tournamentId]
        );

        let matchNumber = 1;
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            const nextMatchId = uuidv4();
            await query(
              `INSERT INTO tournament_matches (id, tournament_id, round, match_number, item1_id, item2_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [nextMatchId, tournamentId, nextRound, matchNumber, winners[i].winnerId, winners[i + 1].winnerId]
            );
            matchNumber++;
          }
        }
      }
    }

    const updatedTournament = await queryOne<Tournament>(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    const nextMatch = await queryOne<TournamentMatch & { item1: WorldCupItem; item2: WorldCupItem }>(
      `SELECT 
        tm.id, tm.round, tm.match_number, tm.winner_id, tm.completed_at,
        i1.id as item1_id, i1.title as item1_title, i1.description as item1_description, i1.image as item1_image,
        i2.id as item2_id, i2.title as item2_title, i2.description as item2_description, i2.image as item2_image
      FROM tournament_matches tm
      JOIN worldcup_items i1 ON tm.item1_id = i1.id
      JOIN worldcup_items i2 ON tm.item2_id = i2.id
      WHERE tm.tournament_id = $1 AND tm.winner_id IS NULL
      ORDER BY tm.round, tm.match_number
      LIMIT 1`,
      [tournamentId]
    );

    const formattedNextMatch = nextMatch ? {
      id: nextMatch.id,
      round: nextMatch.round,
      matchNumber: nextMatch.match_number,
      winnerId: nextMatch.winner_id,
      completedAt: nextMatch.completed_at,
      item1: {
        id: nextMatch.item1_id,
        title: nextMatch.item1_title,
        description: nextMatch.item1_description,
        image: nextMatch.item1_image
      },
      item2: {
        id: nextMatch.item2_id,
        title: nextMatch.item2_title,
        description: nextMatch.item2_description,
        image: nextMatch.item2_image
      }
    } : null;

    res.json({
      success: true,
      data: {
        tournament: updatedTournament,
        nextMatch: formattedNextMatch,
        isCompleted: !!updatedTournament?.completedAt
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Select winner error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/:tournamentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tournamentId } = req.params;

    const tournament = await queryOne<Tournament>(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const currentMatch = await queryOne<TournamentMatch & { item1: WorldCupItem; item2: WorldCupItem }>(
      `SELECT 
        tm.id, tm.round, tm.match_number, tm.winner_id, tm.completed_at,
        i1.id as item1_id, i1.title as item1_title, i1.description as item1_description, i1.image as item1_image,
        i2.id as item2_id, i2.title as item2_title, i2.description as item2_description, i2.image as item2_image
      FROM tournament_matches tm
      JOIN worldcup_items i1 ON tm.item1_id = i1.id
      JOIN worldcup_items i2 ON tm.item2_id = i2.id
      WHERE tm.tournament_id = $1 AND tm.winner_id IS NULL
      ORDER BY tm.round, tm.match_number
      LIMIT 1`,
      [tournamentId]
    );

    const formattedCurrentMatch = currentMatch ? {
      id: currentMatch.id,
      round: currentMatch.round,
      matchNumber: currentMatch.match_number,
      winnerId: currentMatch.winner_id,
      completedAt: currentMatch.completed_at,
      item1: {
        id: currentMatch.item1_id,
        title: currentMatch.item1_title,
        description: currentMatch.item1_description,
        image: currentMatch.item1_image
      },
      item2: {
        id: currentMatch.item2_id,
        title: currentMatch.item2_title,
        description: currentMatch.item2_description,
        image: currentMatch.item2_image
      }
    } : null;

    let winner = null;
    if (tournament.winnerId) {
      winner = await queryOne<WorldCupItem>(
        'SELECT id, title, description, image FROM worldcup_items WHERE id = $1',
        [tournament.winnerId]
      );
    }

    res.json({
      success: true,
      data: {
        tournament,
        currentMatch: formattedCurrentMatch,
        winner
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;