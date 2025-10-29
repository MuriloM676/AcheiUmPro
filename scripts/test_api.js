const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:3000';

  try {
    console.log('🧪 Testando API da plataforma de serviços...\n');

    // 1. Teste de login
    console.log('1. Testando login do cliente...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'client@example.com',
      password: 'password123'
    });

    console.log('✅ Login realizado com sucesso');
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('Usuário:', loginResponse.data.user.name, '-', loginResponse.data.user.role);

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Teste de buscar solicitações
    console.log('\n2. Testando busca de solicitações...');
    const requestsResponse = await axios.get(`${baseURL}/api/requests`, { headers });

    console.log('✅ Solicitações carregadas:', requestsResponse.data.length);
    if (requestsResponse.data.length > 0) {
      console.log('Primeira solicitação:', requestsResponse.data[0].title);
    }

    // 3. Teste de criar nova solicitação
    console.log('\n3. Testando criação de nova solicitação...');
    const newRequest = {
      title: 'Teste - Instalação de ventilador',
      description: 'Preciso instalar um ventilador de teto no quarto',
      category: 'Eletricista',
      location: 'São Paulo, SP',
      budget: 'R$ 80 - R$ 150',
      urgency: 'medium'
    };

    const createResponse = await axios.post(`${baseURL}/api/requests`, newRequest, { headers });
    console.log('✅ Nova solicitação criada com ID:', createResponse.data.id);

    // 4. Teste do provider
    console.log('\n4. Testando login do profissional...');
    const providerLogin = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'provider@example.com',
      password: 'password123'
    });

    const providerToken = providerLogin.data.token;
    const providerHeaders = { Authorization: `Bearer ${providerToken}` };

    console.log('✅ Login do profissional realizado');
    console.log('Profissional:', providerLogin.data.user.name);

    // 5. Teste de ver solicitações disponíveis
    console.log('\n5. Testando solicitações disponíveis para o profissional...');
    const availableRequests = await axios.get(`${baseURL}/api/provider/requests`, { headers: providerHeaders });

    console.log('✅ Solicitações disponíveis:', availableRequests.data.length);
    if (availableRequests.data.length > 0) {
      console.log('Primeira solicitação disponível:', availableRequests.data[0].title);
    }

    console.log('\n🎉 Todos os testes passaram! A API está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAPI();
