'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'

type Categoria =
  | 'TI e Programação'
  | 'Design e Multimídia'
  | 'Tradução e conteúdos'
  | 'Marketing e Vendas'
  | 'Suporte Administrativo'
  | 'Jurídico'
  | 'Finanças e Administração'
  | 'Engenharia e Manufatura'

interface Projeto {
  id: number
  titulo: string
  descricao: string
  precoMin: number
  precoMax: number
  propostaCount: number
  publicadoHa: string
  prazoEntrega: string
  pais: string
  cliente: string
  categoria: Categoria
  tags: string[]
}

const projetosMock: Projeto[] = [
  {
    id: 1,
    titulo: 'Vendas de produtos e serviços',
    descricao:
      'Procuro um profissional de marketing com foco em vendas de produtos e serviços. O objetivo do projeto é gerar conversões reais por meio de estratégias digitais e fechamento direto com o cliente.',
    precoMin: 250,
    precoMax: 500,
    propostaCount: 2,
    publicadoHa: 'há 1 hora',
    prazoEntrega: '01/12/2025',
    pais: 'Brasil',
    cliente: 'E. C.',
    categoria: 'Marketing e Vendas',
    tags: ['E.C.', 'Última resposta: há 11 minutos']
  },
  {
    id: 2,
    titulo:
      'Social Media Manager com IA para Criação de Conteúdo Estratégico',
    descricao:
      'Estamos buscando um Social Media Manager talentoso e inovador para desenvolver e executar nossa estratégia de conteúdo digital. O profissional será responsável pela criação de diversos tipos de conteúdos para nossas redes sociais, com foco em construção de credibilidade, autoridade e branding da empresa, além de atrair novos clientes.',
    precoMin: 15,
    precoMax: 15,
    propostaCount: 6,
    publicadoHa: 'há 7 horas',
    prazoEntrega: '—',
    pais: 'Brasil',
    cliente: 'D. O.',
    categoria: 'Marketing e Vendas',
    tags: ['Social Media Marketing', 'Branding', 'Estratégia de Marketing', 'Lead Generation']
  },
  {
    id: 3,
    titulo: 'Hunter – Projeto Comercial (PJ)',
    descricao:
      'Buscamos um(a) Hunter para atuar em um projeto comercial de grande alcance nacional. A pessoa será responsável por identificar e prospectar novos parceiros comerciais, prospectar potenciais clientes e desenvolver relações estratégicas com funil de prospecção e processos de onboarding até a ativação completa.',
    precoMin: 500,
    precoMax: 1000,
    propostaCount: 33,
    publicadoHa: 'há 12 horas',
    prazoEntrega: '—',
    pais: 'Brasil',
    cliente: 'Zé Delivery – Grupo Ambev',
    categoria: 'Marketing e Vendas',
    tags: ['Cliente enterprise']
  }
]

export default function TrabalhoFreelancerPage() {
  const [busca, setBusca] = useState('')
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Categoria[]>([])

  const categorias: Categoria[] = [
    'TI e Programação',
    'Design e Multimídia',
    'Tradução e conteúdos',
    'Marketing e Vendas',
    'Suporte Administrativo',
    'Jurídico',
    'Finanças e Administração',
    'Engenharia e Manufatura'
  ]

  const projetosFiltrados = useMemo(() => {
    return projetosMock.filter((p) => {
      const porBusca = busca
        ? `${p.titulo} ${p.descricao} ${p.tags.join(' ')}`
            .toLowerCase()
            .includes(busca.toLowerCase())
        : true
      const porCategoria = categoriasSelecionadas.length
        ? categoriasSelecionadas.includes(p.categoria)
        : true
      return porBusca && porCategoria
    })
  }, [busca, categoriasSelecionadas])

  const toggleCategoria = (cat: Categoria) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Barra superior com busca */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-3 rounded-full border focus:outline-none"
            style={{ borderColor: 'var(--secondary-2)' }}
          />
        </div>
        <button
          className="px-5 py-3 rounded-full font-medium"
          style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        >
          Pesquisar
        </button>
      </div>

      {/* Layout principal */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar de classificação */}
        <aside
          className="md:w-1/4 border rounded-lg p-5 bg-white"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h3 className="text-lg font-semibold mb-4">Categoria de projeto</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={categoriasSelecionadas.length === 0} onChange={() => setCategoriasSelecionadas([])} />
              <span>Todas as categorias</span>
            </label>
            {categorias.map((cat) => (
              <label key={cat} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={categoriasSelecionadas.includes(cat)}
                  onChange={() => toggleCategoria(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>

          {/* Habilidades */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-2">Habilidades</h4>
            <input
              type="text"
              placeholder="Informe as habilidades"
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>

          {/* Idioma */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-2">Idioma</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="px-3 py-1 rounded border" style={{ borderColor: '#E5E7EB' }}>Todas</button>
              <button className="px-3 py-1 rounded border" style={{ borderColor: '#E5E7EB' }}>Português</button>
              <button className="px-3 py-1 rounded border" style={{ borderColor: '#E5E7EB' }}>Inglês</button>
              <button className="px-3 py-1 rounded border" style={{ borderColor: '#E5E7EB' }}>Espanhol</button>
            </div>
          </div>
        </aside>

        {/* Lista central de projetos */}
        <section className="md:w-3/4 space-y-5">
          {projetosFiltrados.map((proj) => (
            <article
              key={proj.id}
              className="bg-white rounded-xl shadow-sm border p-5"
              style={{ borderColor: 'var(--secondary-2)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{proj.titulo}</h2>
                  <div className="text-sm text-gray-500 mb-2">
                    Publicado: {proj.publicadoHa} · Propostas: {proj.propostaCount} · Prazo de Entrega: {proj.prazoEntrega}
                  </div>
                  <p className="text-gray-700 mb-3">{proj.descricao}</p>
                  {proj.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {proj.tags.map((t, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: 'var(--secondary-2)', color: 'white' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">{proj.cliente}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span>{proj.pais}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg font-medium"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    Fazer uma proposta
                  </button>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">USD {proj.precoMin} {proj.precoMin !== proj.precoMax ? `- ${proj.precoMax}` : ''}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {projetosFiltrados.length === 0 && (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-600">
              Nenhum projeto encontrado com os filtros selecionados.
            </div>
          )}

          {/* Paginação simples */}
          <div className="flex justify-center gap-2 pt-2">
            <button className="px-3 py-1 rounded border" style={{ borderColor: '#E5E7EB' }}>Anterior</button>
            <button className="px-3 py-1 rounded border" style={{ borderColor: '#E5E7EB' }}>Próximo</button>
          </div>
        </section>
      </div>

      {/* Link auxiliar */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <Link href="/search" className="underline">Prefere buscar prestadores diretamente?</Link>
      </div>
    </main>
  )
}