import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  // Dados de exemplo para profissionais em destaque
  const featuredProfessionals = [
    {
      id: 1,
      name: 'Ana Silva',
      profession: 'Designer Gráfico',
      rating: 4.9,
      reviews: 127,
      image: '/globe.svg',
    },
    {
      id: 2,
      name: 'Carlos Mendes',
      profession: 'Desenvolvedor Web',
      rating: 4.8,
      reviews: 93,
      image: '/file.svg',
    },
    {
      id: 3,
      name: 'Mariana Costa',
      profession: 'Arquiteta',
      rating: 5.0,
      reviews: 64,
      image: '/window.svg',
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-5xl font-bold mb-6">
                Encontre os melhores profissionais para seu projeto
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Conectamos você aos melhores profissionais qualificados para realizar seus projetos com qualidade e segurança.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Cadastre-se Grátis
                </Link>
                <Link
                  href="/search"
                  className="px-8 py-4 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors"
                >
                  Buscar Profissionais
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h2 className="text-blue-700 text-2xl font-bold mb-4">O que você precisa?</h2>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Qual serviço você está procurando?" 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Localização (cidade, estado)" 
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    Encontrar Profissionais
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias de Serviços */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Categorias Populares
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {['Design', 'Desenvolvimento', 'Marketing', 'Tradução', 'Consultoria', 'Arquitetura', 'Fotografia', 'Redação', 'Edição de Vídeo', 'Contabilidade', 'Jurídico', 'Educação'].map((category, index) => (
            <div key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer">
              <p className="font-medium text-gray-800 dark:text-white">{category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profissionais em Destaque */}
      <div className="bg-gray-100 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Profissionais em Destaque
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProfessionals.map((pro) => (
              <div key={pro.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden mr-4">
                      <Image src={pro.image} alt={pro.name} width={64} height={64} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{pro.name}</h3>
                      <p className="text-blue-600 dark:text-blue-400">{pro.profession}</p>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(Math.floor(pro.rating))}
                      {pro.rating % 1 !== 0 && '☆'}
                      {'☆'.repeat(5 - Math.ceil(pro.rating))}
                    </div>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{pro.rating} ({pro.reviews} avaliações)</span>
                  </div>
                  <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Ver Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Como Funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="text-5xl mb-4 text-blue-600">1</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Publique seu projeto
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Descreva o que você precisa e receba propostas de profissionais qualificados.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="text-5xl mb-4 text-blue-600">2</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Escolha o melhor profissional
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Compare propostas, avaliações e portfólios para escolher o profissional ideal.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="text-5xl mb-4 text-blue-600">3</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Acompanhe e avalie
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Acompanhe o progresso do projeto e avalie o profissional ao finalizar.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
        <p className="mb-4">API Backend disponível em:</p>
        <code className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-sm">
          http://localhost:3000/api
        </code>
      </div>
    </div>
  )
}
