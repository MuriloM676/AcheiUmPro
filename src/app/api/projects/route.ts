import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export const runtime = 'nodejs'

interface ProjectRow extends RowDataPacket {
  id: number
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  category: string | null
  skills_required: string | null
  location: string | null
  client_name: string
  client_country: string | null
  proposals_count: number
  created_at: string
  status: string
}

// GET /api/projects - List available projects (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')
    const skills = url.searchParams.get('skills')
    const location = url.searchParams.get('location')
    const budgetMin = url.searchParams.get('budget_min')
    const budgetMax = url.searchParams.get('budget_max')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereConditions = ['r.status = ?']
    let params: any[] = ['pending']

    if (category && category !== 'all') {
      whereConditions.push('r.category = ?')
      params.push(category)
    }

    if (search) {
      whereConditions.push('(r.title LIKE ? OR r.description LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    if (skills) {
      whereConditions.push('r.skills_required LIKE ?')
      params.push(`%${skills}%`)
    }

    if (location) {
      whereConditions.push('r.location LIKE ?')
      params.push(`%${location}%`)
    }

    if (budgetMin) {
      whereConditions.push('(r.budget_min >= ? OR r.budget_min IS NULL)')
      params.push(parseInt(budgetMin))
    }

    if (budgetMax) {
      whereConditions.push('(r.budget_max <= ? OR r.budget_max IS NULL)')
      params.push(parseInt(budgetMax))
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get projects with client info and proposal count
    const query = `
      SELECT 
        r.id,
        COALESCE(r.title, CONCAT('Projeto de ', COALESCE(r.category, 'Serviço'))) as title,
        r.description,
        r.budget_min,
        r.budget_max,
        r.deadline,
        r.category,
        r.skills_required,
        r.location,
        r.created_at,
        r.status,
        u.name as client_name,
        COALESCE(u.location, 'Brasil') as client_country,
        (
          SELECT COUNT(*) 
          FROM requests r2 
          WHERE r2.id = r.id AND r2.status IN ('pending', 'accepted')
        ) as proposals_count
      FROM requests r
      JOIN users u ON u.id = r.client_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)

    const [rows] = await pool.query<ProjectRow[]>(query, params)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM requests r
      JOIN users u ON u.id = r.client_id
      ${whereClause}
    `
    
    const countParams = params.slice(0, -2) // Remove limit and offset
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams)
    const total = countRows[0]?.total || 0

    // Transform data to match frontend expectations
    const projects = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || 'Descrição não fornecida',
      budget: {
        min: row.budget_min,
        max: row.budget_max,
        currency: 'BRL'
      },
      deadline: row.deadline,
      category: row.category || 'Geral',
      skills: row.skills_required ? row.skills_required.split(',').map(s => s.trim()) : [],
      location: row.location || 'Remoto',
      client: {
        name: row.client_name,
        country: row.client_country || 'Brasil'
      },
      proposalsCount: row.proposals_count,
      publishedAt: row.created_at,
      status: row.status
    }))

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}