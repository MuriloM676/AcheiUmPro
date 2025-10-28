import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  // Categorias de serviços
  const serviceCategories = [
    {
      id: 1,
      name: 'Tecnologia',
      description: 'Desenvolvimento web, mobile, suporte técnico e mais',
      icon: '/globe.svg',
      link: '/services/tecnologia'
    },
    {
      id: 2,
      name: 'Design',
      description: 'Design gráfico, web design, ilustração e mais',
      icon: '/file.svg',
      link: '/services/design'
    },
    {
      id: 3,
      name: 'Consultoria',
      description: 'Consultoria empresarial, financeira, jurídica e mais',
      icon: '/window.svg',
      link: '/services/consultoria'
    },
  ];

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
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section - Estilo Workana */}
      <div className="w-full bg-[#f5f2ff]">
        <div className="container mx-auto flex flex-col md:flex-row items-center px-4 py-8">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
              Registre-se e comece a enviar propostas em projetos.
            </h1>
            <div className="mt-8">
              <button className="px-6 py-3 rounded-full text-white font-medium" 
                     style={{ backgroundColor: 'var(--primary)' }}>
                Cadastre-se
              </button>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="relative">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Profissional trabalhando" 
                className="rounded-lg"
              />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full" 
                   style={{ backgroundColor: 'var(--primary)' }}></div>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full border-4 border-white"
                   style={{ borderColor: 'var(--accent)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa e filtros - Estilo Workana */}
      <div className="w-full py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filtros de categoria */}
            <div className="md:w-1/4 border rounded-lg p-6" style={{ borderColor: 'var(--neutral-light)' }}>
              <h3 className="text-lg font-semibold mb-4">Categoria de projeto</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="todas" 
                    className="w-4 h-4 mr-3" 
                    checked 
                  />
                  <label htmlFor="todas" className="text-gray-700">Todas as categorias</label>
                </div>
                
                {serviceCategories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`cat-${category.id}`} 
                      className="w-4 h-4 mr-3" 
                    />
                    <label htmlFor={`cat-${category.id}`} className="text-gray-700">{category.name}</label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Área principal */}
            <div className="md:w-3/4">
              {/* Barra de pesquisa */}
              <div className="mb-8">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar" 
                    className="w-full p-3 pr-12 border rounded-full" 
                    style={{ borderColor: 'var(--neutral-light)' }}
                  />
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Filtro de idioma */}
              <div className="mb-8 flex items-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center text-sm mr-2">
                  Português
                  <button className="ml-2 text-gray-500">×</button>
                </span>
              </div>
              
              {/* Projetos/Serviços */}
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--neutral-light)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'var(--neutral-light)' }}>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    Vendas de produtos e serviços
                  </h2>
                  <div className="flex flex-wrap text-sm text-gray-600 gap-x-4 mb-4">
                    <span>Publicado: há 1 hora</span>
                    <span>Propostas: 2</span>
                    <span>Prazo de Entrega: 01/12/2025</span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Procuro um profissional de marketing com foco em vendas de produtos e serviços. O objetivo do projeto
                    é gerar conversões reais por meio de estratégias digitais e fechamento direto com o cliente.
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                      <span className="text-gray-700">E. C.</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-600">Última resposta: há 11 minutos</span>
                    </div>
                    <button 
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      Fazer uma proposta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profissionais em Destaque */}
      <div className="w-full max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--primary)' }}>
          Profissionais em Destaque
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProfessionals.map((pro) => (
            <div key={pro.id} className="border rounded-lg overflow-hidden shadow-md" 
                 style={{ borderColor: 'var(--neutral-light)' }}>
              <div className="h-40 relative bg-gray-200">
                <Image 
                  src={pro.image} 
                  alt={pro.name} 
                  layout="fill" 
                  objectFit="cover"
                  className="opacity-70"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--primary)' }}>{pro.name}</h3>
                <p className="text-gray-600 mb-3">{pro.profession}</p>
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">{pro.rating} ({pro.reviews} avaliações)</span>
                </div>
                <button className="btn-primary w-full">Ver perfil</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Como Funciona */}
      <div className="w-full max-w-6xl mx-auto mb-16 p-8 rounded-lg" 
           style={{ backgroundColor: 'var(--secondary-2)', color: 'white' }}>
        <h2 className="text-3xl font-bold mb-8 text-center">Como Funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Publique seu projeto</h3>
            <p>Descreva o que você precisa e receba propostas de profissionais qualificados</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Escolha o melhor profissional</h3>
            <p>Compare propostas, avaliações e portfólios para escolher o profissional ideal</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Acompanhe o progresso</h3>
            <p>Comunique-se diretamente e acompanhe o andamento do seu projeto</p>
          </div>
        </div>
      </div>
    </main>
  )
}
