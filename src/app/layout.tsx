import './globals.css'
import { Inter } from 'next/font/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Providers from './providers'
import Navbar from '@/components/Navbar'

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
          <Navbar />
          {children}
          <ToastContainer position="top-right" />
        </Providers>
      </body>
    </html>
  )
}