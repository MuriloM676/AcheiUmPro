'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './Button';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth({ requireAuth: false });

  return (
    <header className="border-b border-gray-200" style={{ backgroundColor: 'white' }}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>AcheiUmPro</h1>
          </Link>

          {/* Menu principal */}
          <nav className="hidden md:flex space-x-8">
            {!isAuthenticated && (
              <>
                <Link 
                  href="/search"
                  className={`text-gray-600 hover:text-primary ${pathname === '/search' ? 'font-medium' : ''}`}
                >
                  Buscar Profissionais
                </Link>
                <Link 
                  href="/register" 
                  className={`text-gray-600 hover:text-primary ${pathname === '/register' ? 'font-medium' : ''}`}
                >
                  Para Profissionais
                </Link>
              </>
            )}
            
            {isAuthenticated && (
              <>
                <Link
                  href={user?.role === 'client' ? '/dashboard/client' : '/dashboard/provider'}
                  className={`text-gray-600 hover:text-primary ${pathname?.includes('/dashboard') ? 'font-medium' : ''}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/search"
                  className={`text-gray-600 hover:text-primary ${pathname === '/search' ? 'font-medium' : ''}`}
                >
                  Buscar
                </Link>
              </>
            )}
          </nav>

          {/* Botões de ação */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/register"
                  className="text-gray-700 hover:text-primary font-medium"
                >
                  Cadastre-se
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md font-medium"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                  }}
                >
                  Entrar
                </Link>
              </>
            ) : (
              <>
                <span className="text-gray-600">Olá, {user?.name}</span>
                <Button onClick={logout} variant="outline" size="sm">
                  Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}