require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testReviewsSystem() {
    let connection;

    try {
        console.log('🧪 Testando sistema de avaliações...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'acheiuser',
            password: process.env.DB_PASSWORD || 'acheipass',
            database: process.env.DB_NAME || 'acheiumpro'
        });

        console.log('✅ Conectado ao banco de dados');

        // 1. Verificar estrutura da tabela reviews
        console.log('\n📋 Verificando estrutura da tabela reviews...');
        const [reviewsStructure] = await connection.execute('DESCRIBE reviews');
        console.log('Colunas da tabela reviews:');
        reviewsStructure.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // 2. Verificar serviços concluídos
        console.log('\n🔍 Verificando serviços concluídos...');
        const [completedServices] = await connection.execute(`
            SELECT sr.id, sr.title, sr.client_id, sr.status, sr.completed_at,
                   c.name as client_name
            FROM service_requests sr
            JOIN users c ON sr.client_id = c.id
            WHERE sr.status = 'completed'
        `);

        console.log(`Encontrados ${completedServices.length} serviços concluídos:`);
        completedServices.forEach(service => {
            console.log(`  - ${service.title} (ID: ${service.id}) - Cliente: ${service.client_name}`);
        });

        // 3. Simular uma avaliação se houver serviços concluídos
        if (completedServices.length > 0) {
            const service = completedServices[0];

            console.log('\n✨ Simulando criação de avaliação...');

            // Verificar se o cliente existe
            const [clientExists] = await connection.execute(
                'SELECT id FROM users WHERE id = ?',
                [service.client_id]
            );

            if (clientExists.length > 0) {
                // Verificar se já existe uma avaliação
                const [existingReview] = await connection.execute(`
                    SELECT id FROM reviews 
                    WHERE request_id = ? AND reviewer_id = ? AND review_type = 'client_to_provider'
                `, [service.id, service.client_id]);

                if (existingReview.length === 0) {
                    // Buscar um provider para o serviço (usando service_proposals)
                    const [providers] = await connection.execute(`
                        SELECT sp.provider_id, u.name as provider_name
                        FROM service_proposals sp
                        JOIN users u ON sp.provider_id = u.id
                        WHERE sp.request_id = ? AND sp.status = 'accepted'
                        LIMIT 1
                    `, [service.id]);

                    if (providers.length > 0) {
                        const provider = providers[0];

                        console.log(`Criando avaliação do cliente ${service.client_name} para o provider ${provider.provider_name}...`);

                        const [result] = await connection.execute(`
                            INSERT INTO reviews (request_id, reviewer_id, reviewed_id, rating, comment, review_type)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, [
                            service.id,
                            service.client_id,
                            provider.provider_id,
                            5,
                            'Excelente serviço! Muito profissional e pontual.',
                            'client_to_provider'
                        ]);

                        console.log(`✅ Avaliação criada com ID: ${result.insertId}`);
                    } else {
                        console.log('⚠️  Nenhum provider encontrado para este serviço');
                    }
                } else {
                    console.log('ℹ️  Já existe uma avaliação para este serviço');
                }
            }
        }

        // 4. Listar todas as avaliações
        console.log('\n📋 Listando todas as avaliações...');
        const [allReviews] = await connection.execute(`
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

        if (allReviews.length === 0) {
            console.log('Nenhuma avaliação encontrada');
        } else {
            console.log(`Encontradas ${allReviews.length} avaliações:`);
            allReviews.forEach(review => {
                console.log(`  - ${review.service_title}: ${review.rating}⭐ por ${review.reviewer_name} para ${review.reviewed_name}`);
                if (review.comment) {
                    console.log(`    "${review.comment}"`);
                }
            });
        }

        // 5. Calcular estatísticas
        console.log('\n📊 Calculando estatísticas de avaliações...');
        const [stats] = await connection.execute(`
            SELECT 
                reviewed_id,
                u.name as user_name,
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating
            FROM reviews r
            JOIN users u ON r.reviewed_id = u.id
            GROUP BY reviewed_id, u.name
            ORDER BY avg_rating DESC
        `);

        if (stats.length > 0) {
            console.log('Estatísticas por usuário:');
            stats.forEach(stat => {
                const avgRating = parseFloat(stat.avg_rating);
                console.log(`  - ${stat.user_name}: ${avgRating.toFixed(1)}⭐ (${stat.total_reviews} avaliações)`);
            });
        } else {
            console.log('Nenhuma estatística disponível');
        }

        console.log('\n🎉 Teste do sistema de avaliações concluído!');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    testReviewsSystem()
        .then(() => {
            console.log('\n✅ Teste finalizado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha no teste:', error);
            process.exit(1);
        });
}

module.exports = testReviewsSystem;
