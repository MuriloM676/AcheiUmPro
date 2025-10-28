'use client';

import React from 'react';

export default function ConsultoriaPage() {
  const servicos = [
    { id: 1, titulo: 'Consultoria Empresarial', descricao: 'Estratégias para crescimento e otimização', preco: 'A partir de R$ 200/hora' },
    { id: 2, titulo: 'Consultoria Financeira', descricao: 'Planejamento financeiro e investimentos', preco: 'A partir de R$ 180/hora' },
    { id: 3, titulo: 'Consultoria Jurídica', descricao: 'Assessoria legal para empresas e indivíduos', preco: 'A partir de R$ 250/hora' },
    { id: 4, titulo: 'Consultoria de Marketing', descricao: 'Estratégias de marketing e branding', preco: 'A partir de R$ 150/hora' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--primary)' }}>Serviços de Consultoria</h1>
      
      <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
        <p className="text-lg">
          Encontre consultores especializados para ajudar seu negócio a crescer.
          Oferecemos consultoria em diversas áreas para atender suas necessidades.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {servicos.map((servico) => (
          <div key={servico.id} className="border rounded-lg overflow-hidden shadow-md" 
               style={{ borderColor: 'var(--accent)', backgroundColor: 'white' }}>
            <div className="p-4" style={{ borderBottom: '2px solid var(--accent)' }}>
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