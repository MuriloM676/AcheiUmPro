require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function createTestData() {
    let connection;

    try {
        console.log('🌱 Criando dados de teste para avaliações...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'acheiuser',
            password: process.env.DB_PASSWORD || 'acheipass',
            database: process.env.DB_NAME || 'acheiumpro'
        });

        console.log('✅ Conectado ao banco de dados');

        // 1. Verificar usuários existentes
        const [users] = await connection.execute('SELECT id, name, email FROM users ORDER BY id');
        console.log('Usuários disponíveis:', users.map(u => `${u.name} (${u.id})`));

        if (users.length < 2) {
            console.log('❌ Precisamos de pelo menos 2 usuários para criar dados de teste');
            return;
        }

        const client = users.find(u => u.email.includes('client')) || users[0];
        const provider = users.find(u => u.email.includes('provider')) || users[1];

        console.log(`Cliente: ${client.name} (ID: ${client.id})`);
        console.log(`Provedor: ${provider.name} (ID: ${provider.id})`);

        // Buscar o provider_id da tabela providers
        const [providerData] = await connection.execute(`
            SELECT id FROM providers WHERE user_id = ?
        `, [provider.id]);

        if (providerData.length === 0) {
            console.log('❌ Provider não encontrado na tabela providers');
            return;
        }

        const providerId = providerData[0].id;
        console.log(`Provider ID na tabela providers: ${providerId}`);

        // 2. Criar uma solicitação de serviço concluída
        console.log('\n📝 Criando solicitação de serviço...');

        const [existingRequest] = await connection.execute(`
            SELECT id FROM service_requests 
            WHERE client_id = ? AND status = 'completed'
            LIMIT 1
        `, [client.id]);

        let requestId;

        if (existingRequest.length > 0) {
            requestId = existingRequest[0].id;
            console.log(`Usando solicitação existente ID: ${requestId}`);
        } else {
            const [requestResult] = await connection.execute(`
                INSERT INTO service_requests (
                    client_id, title, description, category, location, 
                    budget, urgency, status, completed_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                client.id,
                'Desenvolvimento de Website',
                'Criação de um website profissional para pequena empresa',
                'tecnologia',
                'São Paulo, SP',
                5000.00,
                'medium',
                'completed'
            ]);

            requestId = requestResult.insertId;
            console.log(`✅ Solicitação criada com ID: ${requestId}`);
        }

        // 3. Criar uma proposta aceita
        console.log('\n💼 Criando proposta aceita...');

        const [existingProposal] = await connection.execute(`
            SELECT id FROM service_proposals 
            WHERE request_id = ? AND provider_id = ?
        `, [requestId, providerId]);

        if (existingProposal.length === 0) {
            await connection.execute(`
                INSERT INTO service_proposals (
                    request_id, provider_id, proposed_price, message, status, created_at
                ) VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                requestId,
                providerId, // Usar o ID da tabela providers
                4500.00,
                'Posso desenvolver um excelente website para você!',
                'accepted'
            ]);
            console.log('✅ Proposta aceita criada');
        } else {
            console.log('Proposta já existe');
        }

        // 4. Criar avaliação do cliente para o provedor
        console.log('\n⭐ Criando avaliação cliente -> provedor...');

        const [existingClientReview] = await connection.execute(`
            SELECT id FROM reviews 
            WHERE request_id = ? AND reviewer_id = ? AND review_type = 'client_to_provider'
        `, [requestId, client.id]);

        if (existingClientReview.length === 0) {
            const [reviewResult] = await connection.execute(`
                INSERT INTO reviews (
                    request_id, reviewer_id, reviewed_id, provider_id, client_id, rating, comment, review_type, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                requestId,
                client.id,
                provider.id,
                providerId, // provider_id (ID da tabela providers)
                client.id,   // client_id (coluna antiga)
                5,
                'Excelente trabalho! O provedor foi muito profissional, entregou no prazo e superou minhas expectativas. Recomendo!',
                'client_to_provider'
            ]);
            console.log(`✅ Avaliação cliente->provedor criada com ID: ${reviewResult.insertId}`);
        } else {
            console.log('Avaliação cliente->provedor já existe');
        }

        // 5. Criar avaliação do provedor para o cliente
        console.log('\n⭐ Criando avaliação provedor -> cliente...');

        const [existingProviderReview] = await connection.execute(`
            SELECT id FROM reviews 
            WHERE request_id = ? AND reviewer_id = ? AND review_type = 'provider_to_client'
        `, [requestId, provider.id]);

        if (existingProviderReview.length === 0) {
            await connection.execute(`
                INSERT INTO reviews (
                    request_id, reviewer_id, reviewed_id, provider_id, client_id, rating, comment, review_type, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                requestId,
                provider.id,
                client.id,
                providerId, // provider_id (ID da tabela providers)
                client.id,   // client_id (coluna antiga)
                4,
                'Cliente muito comunicativo e claro com seus requisitos. Pagamento pontual. Foi um prazer trabalhar!',
                'provider_to_client'
            ]);
            console.log('✅ Avaliação provedor->cliente criada');
        } else {
            console.log('Avaliação provedor->cliente já existe');
        }

        // 6. Verificar resultados
        console.log('\n📊 Verificando dados criados...');

        const [finalReviews] = await connection.execute(`
            SELECT r.*, 
                   reviewer.name as reviewer_name,
                   reviewed.name as reviewed_name,
                   sr.title as service_title
            FROM reviews r
            JOIN users reviewer ON r.reviewer_id = reviewer.id
            JOIN users reviewed ON r.reviewed_id = reviewed.id
            JOIN service_requests sr ON r.request_id = sr.id
            ORDER BY r.created_at DESC
        `);

        console.log(`Total de avaliações: ${finalReviews.length}`);
        finalReviews.forEach(review => {
            console.log(`  - ${review.service_title}: ${review.rating}⭐ (${review.review_type})`);
            console.log(`    De: ${review.reviewer_name} → Para: ${review.reviewed_name}`);
            console.log(`    "${review.comment}"`);
            console.log('');
        });

        console.log('🎉 Dados de teste criados com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao criar dados de teste:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    createTestData()
        .then(() => {
            console.log('✅ Criação de dados de teste finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha na criação de dados de teste:', error);
            process.exit(1);
        });
}

module.exports = createTestData;
