require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function updateReviewsTable() {
    let connection;

    try {
        console.log('🔄 Conectando ao banco de dados...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'acheiuser',
            password: process.env.DB_PASSWORD || 'acheipass',
            database: process.env.DB_NAME || 'acheiumpro'
        });

        console.log('✅ Conectado ao banco de dados');

        console.log('🔄 Atualizando estrutura da tabela reviews...');

        // Primeiro, verificar a estrutura atual
        const [currentColumns] = await connection.execute('DESCRIBE reviews');
        console.log('Estrutura atual da reviews:', currentColumns.map(c => `${c.Field} (${c.Type})`));

        // Adicionar novas colunas se não existirem
        const columnNames = currentColumns.map(c => c.Field);

        if (!columnNames.includes('request_id')) {
            console.log('🔄 Adicionando coluna request_id...');
            await connection.execute(`
                ALTER TABLE reviews 
                ADD COLUMN request_id INT NOT NULL AFTER id
            `);
        }

        if (!columnNames.includes('reviewer_id')) {
            console.log('🔄 Adicionando coluna reviewer_id...');
            await connection.execute(`
                ALTER TABLE reviews 
                ADD COLUMN reviewer_id INT NOT NULL AFTER request_id
            `);
        }

        if (!columnNames.includes('reviewed_id')) {
            console.log('🔄 Adicionando coluna reviewed_id...');
            await connection.execute(`
                ALTER TABLE reviews 
                ADD COLUMN reviewed_id INT NOT NULL AFTER reviewer_id
            `);
        }

        if (!columnNames.includes('review_type')) {
            console.log('🔄 Adicionando coluna review_type...');
            await connection.execute(`
                ALTER TABLE reviews 
                ADD COLUMN review_type ENUM('client_to_provider', 'provider_to_client') NOT NULL AFTER comment
            `);
        }

        if (!columnNames.includes('updated_at')) {
            console.log('🔄 Adicionando coluna updated_at...');
            await connection.execute(`
                ALTER TABLE reviews 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
        }

        // Adicionar foreign keys se não existirem
        console.log('🔄 Adicionando foreign keys...');
        try {
            await connection.execute(`
                ALTER TABLE reviews 
                ADD CONSTRAINT fk_reviews_request 
                FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
            `);
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Info: Foreign key para request_id já existe ou erro:', e.message);
            }
        }

        try {
            await connection.execute(`
                ALTER TABLE reviews 
                ADD CONSTRAINT fk_reviews_reviewer 
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
            `);
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Info: Foreign key para reviewer_id já existe ou erro:', e.message);
            }
        }

        try {
            await connection.execute(`
                ALTER TABLE reviews 
                ADD CONSTRAINT fk_reviews_reviewed 
                FOREIGN KEY (reviewed_id) REFERENCES users(id) ON DELETE CASCADE
            `);
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Info: Foreign key para reviewed_id já existe ou erro:', e.message);
            }
        }

        // Adicionar índices
        console.log('🔄 Criando índices...');
        try {
            await connection.execute('CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id)');
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Info: Índice reviewed_id já existe ou erro:', e.message);
            }
        }

        try {
            await connection.execute('CREATE INDEX idx_reviews_request_id ON reviews(request_id)');
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Info: Índice request_id já existe ou erro:', e.message);
            }
        }

        // Adicionar constraint única
        try {
            await connection.execute(`
                ALTER TABLE reviews 
                ADD CONSTRAINT unique_review 
                UNIQUE KEY (request_id, reviewer_id, review_type)
            `);
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) {
                console.log('Info: Constraint única já existe ou erro:', e.message);
            }
        }

        console.log('✅ Migrações da tabela reviews aplicadas com sucesso!');

        // Verificar estrutura final
        const [finalColumns] = await connection.execute('DESCRIBE reviews');
        console.log('\n📋 Estrutura final da tabela reviews:');
        finalColumns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar tabela reviews:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    updateReviewsTable()
        .then(() => {
            console.log('🎉 Atualização da tabela reviews concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha na atualização:', error);
            process.exit(1);
        });
}

module.exports = updateReviewsTable;
