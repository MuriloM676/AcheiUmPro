import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ReviewData {
  request_id: number;
  reviewed_id: number;
  rating: number;
  comment?: string;
  review_type: 'client_to_provider' | 'provider_to_client';
}

interface ReviewRow extends RowDataPacket {
  id: number;
  request_id: number;
  reviewer_id: number;
  reviewed_id: number;
  rating: number;
  comment: string;
  review_type: 'client_to_provider' | 'provider_to_client';
  created_at: string;
  updated_at: string;
  reviewer_name: string;
  reviewed_name: string;
  service_title: string;
}

// GET - Buscar avaliações
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const requestId = searchParams.get('request_id');
    const type = searchParams.get('type') as 'received' | 'given' | null;

    let query = `
      SELECT r.*, 
             reviewer.name as reviewer_name,
             reviewed.name as reviewed_name,
             sr.title as service_title
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN users reviewed ON r.reviewed_id = reviewed.id
      JOIN service_requests sr ON r.request_id = sr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      if (type === 'received') {
        query += ' AND r.reviewed_id = ?';
      } else if (type === 'given') {
        query += ' AND r.reviewer_id = ?';
      } else {
        query += ' AND (r.reviewer_id = ? OR r.reviewed_id = ?)';
        params.push(userId);
      }
      params.push(userId);
    }

    if (requestId) {
      query += ' AND r.request_id = ?';
      params.push(requestId);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.execute<ReviewRow[]>(query, params);

    return NextResponse.json({ reviews: rows });

  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova avaliação
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = user.id;
    const body: ReviewData = await request.json();

    const { request_id, reviewed_id, rating, comment, review_type } = body;

    // Validações
    if (!request_id || !reviewed_id || !rating || !review_type) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Avaliação deve ser entre 1 e 5' }, { status: 400 });
    }

    if (userId === reviewed_id) {
      return NextResponse.json({ error: 'Não é possível avaliar a si mesmo' }, { status: 400 });
    }

    // Verificar se o serviço está concluído
    const [requestRows] = await pool.execute<RowDataPacket[]>(
      'SELECT status, client_id FROM service_requests WHERE id = ?',
      [request_id]
    );

    if (requestRows.length === 0) {
      return NextResponse.json({ error: 'Solicitação de serviço não encontrada' }, { status: 404 });
    }

    const serviceRequest = requestRows[0];
    if (serviceRequest.status !== 'completed') {
      return NextResponse.json({ error: 'Só é possível avaliar serviços concluídos' }, { status: 400 });
    }

    // Verificar se o usuário tem permissão para fazer esta avaliação
    let isAuthorized = false;
    if (review_type === 'client_to_provider' && userId === serviceRequest.client_id) {
      isAuthorized = true;
    } else if (review_type === 'provider_to_client') {
      // Verificar se o usuário é o provedor aceito para este serviço
      const [proposalRows] = await pool.execute<RowDataPacket[]>(
        'SELECT provider_id FROM service_proposals WHERE request_id = ? AND status = "accepted"',
        [request_id]
      );
      if (proposalRows.length > 0 && userId === proposalRows[0].provider_id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Você não tem permissão para fazer esta avaliação' }, { status: 403 });
    }

    // Verificar se já existe uma avaliação deste tipo
    const [existingReviews] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE request_id = ? AND reviewer_id = ? AND review_type = ?',
      [request_id, userId, review_type]
    );

    if (existingReviews.length > 0) {
      return NextResponse.json({ error: 'Você já avaliou este serviço' }, { status: 400 });
    }

    // Buscar dados necessários para as colunas obrigatórias
    let providerId = null;
    let clientId = serviceRequest.client_id;

    if (review_type === 'client_to_provider') {
      // Buscar o provider_id da proposta aceita
      const [proposalRows] = await pool.execute<RowDataPacket[]>(
        'SELECT provider_id FROM service_proposals WHERE request_id = ? AND status = "accepted"',
        [request_id]
      );
      if (proposalRows.length > 0) {
        providerId = proposalRows[0].provider_id;
      }
    } else {
      // Para provider_to_client, buscar o provider_id do usuário atual
      const [providerRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM providers WHERE user_id = ?',
        [userId]
      );
      if (providerRows.length > 0) {
        providerId = providerRows[0].id;
      }
    }

    // Criar a avaliação
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO reviews (request_id, reviewer_id, reviewed_id, provider_id, client_id, rating, comment, review_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [request_id, userId, reviewed_id, providerId, clientId, rating, comment || null, review_type]
    );

    // Buscar a avaliação criada com dados completos
    const [newReview] = await pool.execute<ReviewRow[]>(
      `SELECT r.*, 
              reviewer.name as reviewer_name,
              reviewed.name as reviewed_name,
              sr.title as service_title
       FROM reviews r
       JOIN users reviewer ON r.reviewer_id = reviewer.id
       JOIN users reviewed ON r.reviewed_id = reviewed.id
       JOIN service_requests sr ON r.request_id = sr.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      message: 'Avaliação criada com sucesso',
      review: newReview[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar avaliação
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { review_id, rating, comment } = body;

    if (!review_id || !rating) {
      return NextResponse.json({ error: 'ID da avaliação e nota são obrigatórios' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Avaliação deve ser entre 1 e 5' }, { status: 400 });
    }

    // Verificar se a avaliação existe e pertence ao usuário
    const [reviewRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE id = ? AND reviewer_id = ?',
      [review_id, userId]
    );

    if (reviewRows.length === 0) {
      return NextResponse.json({ error: 'Avaliação não encontrada ou sem permissão' }, { status: 404 });
    }

    // Atualizar a avaliação
    await pool.execute(
      'UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?',
      [rating, comment || null, review_id]
    );

    return NextResponse.json({ message: 'Avaliação atualizada com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover avaliação
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('review_id');

    if (!reviewId) {
      return NextResponse.json({ error: 'ID da avaliação é obrigatório' }, { status: 400 });
    }

    // Verificar se a avaliação existe e pertence ao usuário
    const [reviewRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE id = ? AND reviewer_id = ?',
      [reviewId, userId]
    );

    if (reviewRows.length === 0) {
      return NextResponse.json({ error: 'Avaliação não encontrada ou sem permissão' }, { status: 404 });
    }

    // Remover a avaliação
    await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

    return NextResponse.json({ message: 'Avaliação removida com sucesso' });

  } catch (error) {
    console.error('Erro ao remover avaliação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
