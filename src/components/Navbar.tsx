'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

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
            <Link 
              href="/search"
              className={`text-gray-600 hover:text-primary ${pathname === '/search' ? 'font-medium' : ''}`}
            >
              Buscar Profissionais
            </Link>
            <Link 
              href="/trabalho-freelancer" 
              className={`text-gray-600 hover:text-primary ${pathname === '/trabalho-freelancer' ? 'font-medium' : ''}`}
            >
              Trabalho Freelancer
            </Link>
          </nav>

          {/* Botões de ação */}
          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </div>
    </header>
  );
}