import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-toastify'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AcheiUmPro - Encontre Profissionais',
  description: 'Plataforma para encontrar prestadores de serviços',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}