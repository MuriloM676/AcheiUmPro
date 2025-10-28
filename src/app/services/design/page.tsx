'use client';

import React from 'react';
import Link from 'next/link';

export default function DesignPage() {
  const servicos = [
    { id: 1, titulo: 'Design Gráfico', descricao: 'Criação de logos, banners e materiais gráficos', preco: 'A partir de R$ 500' },
    { id: 2, titulo: 'Web Design', descricao: 'Design de sites e interfaces web', preco: 'A partir de R$ 1.200' },
    { id: 3, titulo: 'Design de Produto', descricao: 'Design de produtos físicos e digitais', preco: 'A partir de R$ 2.000' },
    { id: 4, titulo: 'Ilustração', descricao: 'Ilustrações digitais e tradicionais', preco: 'A partir de R$ 300' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--primary)' }}>Serviços de Design</h1>
      
      <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--secondary-2)', color: 'white' }}>
        <p className="text-lg">
          Encontre designers talentosos para transformar suas ideias em realidade.
          Desde logos até ilustrações completas, temos profissionais para todos os projetos.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map((servico) => (
          <div key={servico.id} className="border rounded-lg overflow-hidden shadow-md" 
               style={{ borderColor: 'var(--secondary-1)', backgroundColor: 'white' }}>
            <div className="p-4" style={{ borderBottom: '2px solid var(--secondary-1)' }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary)' }}>{servico.titulo}</h3>
              <p className="text-gray-600 mb-4">{servico.descricao}</p>
              <p className="font-bold" style={{ color: 'var(--secondary-1)' }}>{servico.preco}</p>
            </div>
            <div className="p-4 flex justify-between">
              <button className="btn-primary">Ver detalhes</button>
              <button className="btn-accent">Contratar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}