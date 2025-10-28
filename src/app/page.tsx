import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AcheiUmPro
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Encontre os melhores profissionais para o seu projeto
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Cadastrar
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/search"
              className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Buscar Profissionais
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Para Clientes
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Encontre profissionais qualificados para realizar seus projetos com qualidade e segurança.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Para Prestadores
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Cadastre seus serviços e seja encontrado por clientes que precisam do seu trabalho.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Avaliações
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sistema de avaliações para garantir a qualidade e confiança entre clientes e profissionais.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p className="mb-4">API Backend disponível em:</p>
          <code className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-sm">
            http://localhost:3000/api
          </code>
        </div>
      </div>
    </div>
  )
}
