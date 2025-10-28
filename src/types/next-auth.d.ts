import 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'client' | 'provider'
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: 'client' | 'provider'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'client' | 'provider'
  }
}