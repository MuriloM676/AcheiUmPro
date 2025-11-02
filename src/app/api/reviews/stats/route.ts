import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface StatsRow extends RowDataPacket {
  user_id: number;
  user_name: string;
  total_reviews: number;
  average_rating: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
}

// GET - Buscar estatísticas de avaliações de um usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Buscar estatísticas detalhadas das avaliações recebidas
    const [statsRows] = await pool.execute<StatsRow[]>(
      `SELECT 
        r.reviewed_id as user_id,
        u.name as user_name,
        COUNT(r.id) as total_reviews,
        ROUND(AVG(r.rating), 2) as average_rating,
        SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as rating_1,
        SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as rating_5
      FROM reviews r
      JOIN users u ON r.reviewed_id = u.id
      WHERE r.reviewed_id = ?
      GROUP BY r.reviewed_id, u.name`,
      [userId]
    );

    if (statsRows.length === 0) {
      return NextResponse.json({
        user_id: parseInt(userId),
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        }
      });
    }

    const stats = statsRows[0];

    return NextResponse.json({
      user_id: stats.user_id,
      user_name: stats.user_name,
      total_reviews: stats.total_reviews,
      average_rating: stats.average_rating,
      rating_distribution: {
        1: stats.rating_1,
        2: stats.rating_2,
        3: stats.rating_3,
        4: stats.rating_4,
        5: stats.rating_5
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de avaliações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
