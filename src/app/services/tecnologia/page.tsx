'use client';

import React from 'react';
import Link from 'next/link';

export default function TecnologiaPage() {
  const servicos = [
    { id: 1, titulo: 'Desenvolvimento Web', descricao: 'Criação de sites e aplicações web', preco: 'A partir de R$ 1.500' },
    { id: 2, titulo: 'Desenvolvimento Mobile', descricao: 'Criação de aplicativos para iOS e Android', preco: 'A partir de R$ 2.000' },
    { id: 3, titulo: 'Suporte Técnico', descricao: 'Assistência técnica para computadores e redes', preco: 'A partir de R$ 100/hora' },
    { id: 4, titulo: 'Consultoria em TI', descricao: 'Consultoria especializada em tecnologia', preco: 'A partir de R$ 150/hora' },
    { id: 5, titulo: 'Design UX/UI', descricao: 'Design de interfaces e experiência do usuário', preco: 'A partir de R$ 1.200' },
    { id: 6, titulo: 'SEO e Marketing Digital', descricao: 'Otimização para mecanismos de busca', preco: 'A partir de R$ 800' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--primary)' }}>Serviços de Tecnologia</h1>
      
      <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--secondary-1)', color: 'white' }}>
        <p className="text-lg">
          Encontre os melhores profissionais de tecnologia para o seu projeto. 
          Desde desenvolvimento web até suporte técnico, temos especialistas prontos para ajudar.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map((servico) => (
          <div key={servico.id} className="border rounded-lg overflow-hidden shadow-md" 
               style={{ borderColor: 'var(--secondary-2)', backgroundColor: 'white' }}>
            <div className="p-4" style={{ borderBottom: '2px solid var(--secondary-2)' }}>
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