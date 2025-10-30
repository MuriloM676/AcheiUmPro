"use client";

import React, { useState } from 'react';
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

interface SearchResult {
  id: number;
  name: string;
  service: string;
  location: string;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: replace with real API request
    setResults([
      { id: 1, name: 'João Silva', service: 'Eletricista', location: 'São Paulo' },
      { id: 2, name: 'Maria Oliveira', service: 'Encanadora', location: 'Rio de Janeiro' },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f6f9ff]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 text-[color:var(--secondary-1)]">Buscar Profissionais</h1>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            label="Serviço ou Localização"
            placeholder="Ex: eletricista, São Paulo"
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            className="flex-1"
          />
          <Button type="submit" className="whitespace-nowrap">Buscar</Button>
        </form>

        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="text-gray-500">Nenhum resultado. Tente outra busca.</div>
          ) : (
            results.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{r.name}</h3>
                    <p className="text-sm text-gray-600">{r.service} • {r.location}</p>
                  </div>
                  <div>
                    <Button variant="outline" onClick={() => window.location.href = `/provider/${r.id}`}>Ver Perfil</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
