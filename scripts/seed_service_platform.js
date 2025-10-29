require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')

const categories = [
  'Eletricista', 'Encanador', 'Pintor', 'Pedreiro', 'Marceneiro',
  'Jardineiro', 'Limpeza', 'Reformas', 'Ar Condicionado', 'Outros'
]

async function seedServicePlatform() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'acheiuser',
    password: process.env.DB_PASSWORD || 'acheipass',
    database: process.env.DB_NAME || 'acheiumpro'
  })

  try {
    console.log('🌱 Iniciando seed da plataforma de serviços...')

    // Limpar dados existentes
    await connection.execute('DELETE FROM service_proposals')
    await connection.execute('DELETE FROM service_requests')
    await connection.execute('DELETE FROM users WHERE email IN (?, ?, ?)',
      ['client@example.com', 'provider@example.com', 'provider2@example.com'])

    // Criar usuários de teste
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Cliente
    const [clientResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
      ['João Silva', 'client@example.com', hashedPassword, 'client', '(11) 99999-1111', 'São Paulo, SP']
    )
    const clientId = clientResult.insertId

    // Profissionais
    const [provider1Result] = await connection.execute(
      'INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
      ['Maria Santos', 'provider@example.com', hashedPassword, 'provider', '(11) 99999-2222', 'São Paulo, SP']
    )
    const provider1Id = provider1Result.insertId

    const [provider2Result] = await connection.execute(
      'INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
      ['Carlos Oliveira', 'provider2@example.com', hashedPassword, 'provider', '(11) 99999-3333', 'São Paulo, SP']
    )
    const provider2Id = provider2Result.insertId


    console.log('✅ Usuários criados')

    // Criar solicitações de serviço
    const serviceRequests = [
      {
        title: 'Trocar resistência do chuveiro',
        description: 'Meu chuveiro parou de esquentar. Preciso trocar a resistência urgente.',
        category: 'Eletricista',
        location: 'Vila Madalena, São Paulo - SP',
        budget: 'R$ 80 - R$ 150',
        urgency: 'high'
      },
      {
        title: 'Vazamento na pia da cozinha',
        description: 'A pia da cozinha está vazando por baixo. Preciso de um encanador.',
        category: 'Encanador',
        location: 'Pinheiros, São Paulo - SP',
        budget: 'R$ 100 - R$ 200',
        urgency: 'medium'
      },
      {
        title: 'Pintura da sala',
        description: 'Quero pintar a sala de estar. Aproximadamente 20m².',
        category: 'Pintor',
        location: 'Itaim Bibi, São Paulo - SP',
        budget: 'R$ 300 - R$ 500',
        urgency: 'low'
      },
      {
        title: 'Instalação de ventilador de teto',
        description: 'Comprei um ventilador de teto e preciso de instalação.',
        category: 'Eletricista',
        location: 'Moema, São Paulo - SP',
        budget: 'R$ 60 - R$ 120',
        urgency: 'medium'
      }
    ]

    const requestIds = []
    for (const request of serviceRequests) {
      const [result] = await connection.execute(
        'INSERT INTO service_requests (client_id, title, description, category, location, budget, urgency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [clientId, request.title, request.description, request.category, request.location, request.budget, request.urgency, 'pending']
      )
      requestIds.push(result.insertId)
    }

    console.log('✅ Solicitações de serviço criadas')

    // Criar algumas propostas de exemplo
    const proposals = [
      { requestId: requestIds[0], providerId: provider1Id, price: 120.00 },
      { requestId: requestIds[0], providerId: provider2Id, price: 100.00 },
      { requestId: requestIds[1], providerId: provider1Id, price: 150.00 },
      { requestId: requestIds[3], providerId: provider2Id, price: 80.00 }
    ]

    for (const proposal of proposals) {
      await connection.execute(
        'INSERT INTO service_proposals (request_id, provider_id, proposed_price, status) VALUES (?, ?, ?, ?)',
        [proposal.requestId, proposal.providerId, proposal.price, 'pending']
      )
    }

    console.log('✅ Propostas criadas')

    // Criar algumas notificações
    const notifications = [
      {
        userId: clientId,
        title: 'Nova proposta recebida!',
        body: 'Você recebeu uma nova proposta para "Trocar resistência do chuveiro"'
      },
      {
        userId: provider1Id,
        title: 'Nova solicitação disponível',
        body: 'Uma nova solicitação de "Eletricista" foi criada na sua região'
      }
    ]

    for (const notification of notifications) {
      await connection.execute(
        'INSERT INTO notifications (user_id, title, body, channel) VALUES (?, ?, ?, ?)',
        [notification.userId, notification.title, notification.body, 'in_app']
      )
    }

    console.log('✅ Notificações criadas')

    console.log('\n🎉 Seed concluído com sucesso!')
    console.log('\n📧 Credenciais de teste:')
    console.log('Cliente: client@example.com / password123')
    console.log('Profissional 1: provider@example.com / password123')
    console.log('Profissional 2: provider2@example.com / password123')

    console.log('\n📊 Dados criados:')
    console.log(`- ${serviceRequests.length} solicitações de serviço`)
    console.log(`- ${proposals.length} propostas`)
    console.log(`- ${notifications.length} notificações`)

  } catch (error) {
    console.error('❌ Erro no seed:', error)
    throw error
  } finally {
    await connection.end()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedServicePlatform()
    .then(() => {
      console.log('✅ Seed executado com sucesso')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error)
      process.exit(1)
    })
}

module.exports = seedServicePlatform
