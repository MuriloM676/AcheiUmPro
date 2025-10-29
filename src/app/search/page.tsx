import React, { useState } from 'react';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para buscar profissionais no backend
    console.log('Buscando por:', query);
    // Simulação de resultados
    setResults([
      { id: 1, name: 'João Silva', service: 'Eletricista', location: 'São Paulo' },
      { id: 2, name: 'Maria Oliveira', service: 'Encanadora', location: 'Rio de Janeiro' },
    ]);
  };

  return (
    <div>
      <h1>Buscar Profissionais</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Digite o serviço ou localização"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>
      <div>
        <h2>Resultados:</h2>
        <ul>
          {results.map((result) => (
            <li key={result.id}>
              {result.name} - {result.service} ({result.location})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Search;
