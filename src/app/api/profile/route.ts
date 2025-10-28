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
  location?: string | null;
  phone?: string | null;
  description?: string | null;
  photo_url?: string | null;
}

interface ProviderInfoRow extends RowDataPacket {
  id: number;
  description: string | null;
  photo_url: string | null;
}

interface ProviderIdRow extends RowDataPacket {
  id: number;
}

async function buildProfileForUser(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  location?: string | null;
  created_at?: string;
}): Promise<UserProfile> {
  const profile: UserProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.created_at || new Date().toISOString(),
    phone: user.phone ?? null,
    location: user.location ?? null
  };

  if (user.role === 'provider') {
    const [providerRows] = await pool.query<ProviderInfoRow[]>(
      'SELECT id, description, photo_url FROM providers WHERE user_id = ? LIMIT 1',
      [user.id]
    );

    if (providerRows.length > 0) {
      profile.provider_id = providerRows[0].id;
      profile.description = providerRows[0].description;
      profile.photo_url = providerRows[0].photo_url;
    }
  }

  return profile;
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

    const profile = await buildProfileForUser(user);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile - Update current user profile
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const location = typeof body.location === 'string' ? body.location.trim() : undefined;
    const description = typeof body.description === 'string' ? body.description.trim() : undefined;
    const photoUrl = typeof body.photo_url === 'string' ? body.photo_url.trim() : undefined;

    const userUpdates: string[] = [];
    const userParams: Array<string | null> = [];

    if (name !== undefined) {
      if (!name) {
        return NextResponse.json({ error: 'O nome não pode ser vazio.' }, { status: 400 });
      }
      userUpdates.push('name = ?');
      userParams.push(name);
    }

    if (phone !== undefined) {
      userUpdates.push('phone = ?');
      userParams.push(phone || null);
    }

    if (location !== undefined) {
      userUpdates.push('location = ?');
      userParams.push(location || null);
    }

    if (userUpdates.length === 0 && user.role === 'provider' && description === undefined && photoUrl === undefined) {
      return NextResponse.json({ error: 'Nenhuma alteração fornecida.' }, { status: 400 });
    }

    if (userUpdates.length > 0) {
      await pool.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, [...userParams, user.id]);
    }

    if (user.role === 'provider' && (description !== undefined || photoUrl !== undefined)) {
      const [providerRows] = await pool.query<ProviderIdRow[]>(
        'SELECT id FROM providers WHERE user_id = ? LIMIT 1',
        [user.id]
      );

      const providerUpdates: string[] = [];
      const providerParams: Array<string | null> = [];

      if (description !== undefined) {
        providerUpdates.push('description = ?');
        providerParams.push(description || null);
      }

      if (photoUrl !== undefined) {
        providerUpdates.push('photo_url = ?');
        providerParams.push(photoUrl || null);
      }

      if (providerRows.length > 0) {
        if (providerUpdates.length > 0) {
          await pool.query(
            `UPDATE providers SET ${providerUpdates.join(', ')} WHERE id = ?`,
            [...providerParams, providerRows[0].id]
          );
        }
      } else {
        await pool.query(
          'INSERT INTO providers (user_id, description, photo_url) VALUES (?, ?, ?)',
          [
            user.id,
            description !== undefined ? description || null : null,
            photoUrl !== undefined ? photoUrl || null : null
          ]
        );
      }
    }

    const refreshedUser = await getUserFromToken(token);
    if (!refreshedUser) {
      return NextResponse.json({ error: 'Não foi possível atualizar o perfil.' }, { status: 500 });
    }

    const updatedProfile = await buildProfileForUser(refreshedUser);

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
