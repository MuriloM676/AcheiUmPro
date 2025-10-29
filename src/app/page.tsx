'use client'

import React, { useState } from 'react'
import Link from 'next/link'

const categories = [
  'Eletricista', 'Encanador', 'Pintor', 'Pedreiro', 'Marceneiro',
  'Jardineiro', 'Limpeza', 'Reformas', 'Ar Condicionado', 'Outros'
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Encontre o</span>{' '}
                  <span className="block text-blue-600 xl:inline">profissional ideal</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Conecte-se com profissionais qualificados para resolver seus problemas.
                  Solicite orçamentos e escolha a melhor proposta.
                </p>

                {/* Search Bar */}
                <div className="mt-8 max-w-lg mx-auto lg:mx-0">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Que tipo de serviço você precisa?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      Buscar
                    </button>
                  </div>
                </div>

                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      Começar Agora
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                    >
                      Já tenho conta
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Categorias</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Encontre o profissional certo
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <div
                key={category}
                className="bg-gray-50 p-4 rounded-lg text-center hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Como Funciona</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simples e eficiente
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <span className="text-xl">1</span>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Descreva seu problema</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Conte-nos o que precisa: eletricista, encanador, pintor, etc.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <span className="text-xl">2</span>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Receba propostas</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Profissionais interessados enviarão suas propostas com preços.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <span className="text-xl">3</span>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Escolha o melhor</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Compare as propostas e escolha o profissional ideal para você.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Pronto para começar?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Junte-se a centenas de pessoas que já encontraram o profissional ideal
          </p>
          <Link
            href="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
          >
            Criar conta gratuita
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">© 2024 AcheiUmPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
