import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db';
import { RowDataPacket } from 'mysql2';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt'
import type { Session } from 'next-auth'
import { NextRequest } from 'next/server';
import { User } from '@/types';
import { logger } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = '7d';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, email, password, role FROM users WHERE email = ?',
            [credentials.email]
          );

          const user = rows[0];
          if (!user) {
            return null;
          }

          if (user.status && user.status !== 'active') {
            return null;
          }

          const isValid = await comparePassword(credentials.password, user.password);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          logger.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT & { id?: string; role?: string }; user?: any }) {
      if (user) {
        (token as any).id = user.id;
        (token as any).role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session & { user?: any }; token: JWT & { id?: string; role?: string } }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || JWT_SECRET,
};

interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: User): string {
  // include minimal claims
  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, role, phone, location, created_at
       FROM users
      WHERE id = ?`,
    [decoded.id]
  );
  const user = (rows[0] as User) || null;
  if (!user) return null;
  if (user.status && user.status !== 'active') {
    return null;
  }
  return user;
}

// Helper function to extract token from request and get user
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  return getUserFromToken(token);
}
