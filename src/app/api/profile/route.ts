import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export const runtime = 'nodejs';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
  provider_id?: number;
  location?: string;
  phone?: string;
  description?: string;
  photo_url?: string;
}

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at || new Date().toISOString()
    };

    // If provider, get additional provider info
    if (user.role === 'provider') {
      const [providerRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, description, photo_url FROM providers WHERE user_id = ?',
        [user.id]
      );

      if (providerRows.length > 0) {
        const provider = providerRows[0];
        profile.provider_id = provider.id;
        profile.description = provider.description;
        profile.photo_url = provider.photo_url;
      }

      profile.location = user.location;
      profile.phone = user.phone;
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
