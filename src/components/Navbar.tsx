'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './Button';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth({ requireAuth: false });

  return (
    <header className={`header-container`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--secondary-1)' }}>AcheiUmPro</h1>
          </Link>

          {/* Menu principal */}
          <nav className="hidden md:flex space-x-8">
            {isAuthenticated && (
              <>
                <Link
                  href={user?.role === 'client' ? '/dashboard/client' : '/dashboard/provider'}
                  className={`${pathname?.includes('/dashboard') ? 'font-medium' : ''} hover:text-[var(--secondary-1)]`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/search"
                  className={`hover:text-[var(--secondary-1)] ${pathname === '/search' ? 'font-medium' : ''}`}
                >
                  Buscar
                </Link>
                <Link
                  href="/calendar"
                  className={`hover:text-[var(--secondary-1)] ${pathname === '/calendar' ? 'font-medium' : ''}`}
                >
                  Calendário
                </Link>
                <Link
                  href="/reviews"
                  className={`hover:text-[var(--secondary-1)] ${pathname === '/reviews' ? 'font-medium' : ''}`}
                >
                  Avaliações
                </Link>
                {user?.role === 'provider' && (
                  <Link
                    href="/analytics"
                    className={`hover:text-[var(--secondary-1)] ${pathname === '/analytics' ? 'font-medium' : ''}`}
                  >
                    Analytics
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Botões de ação */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/register"
                  className="font-medium"
                  style={{ color: 'var(--header-text)' }}
                >
                  Cadastre-se
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md font-medium"
                  style={{
                    backgroundColor: 'var(--secondary-1)',
                    color: 'white',
                  }}
                >
                  Entrar
                </Link>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--header-text)' }}>Olá, {user?.name}</span>
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