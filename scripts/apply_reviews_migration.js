require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyReviewsMigration() {
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

        console.log('🔄 Aplicando migrações...');

        // Executar as migrações individualmente

        // 1. Criar tabela reviews
        console.log('🔄 Criando tabela reviews...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                request_id INT NOT NULL,
                reviewer_id INT NOT NULL,
                reviewed_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                review_type ENUM('client_to_provider', 'provider_to_client') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_id) REFERENCES users(id) ON DELETE CASCADE,
                
                UNIQUE KEY unique_review (request_id, reviewer_id, review_type)
            )
        `);

        // 2. Verificar se coluna status já existe
        const [statusColumns] = await connection.execute("SHOW COLUMNS FROM service_requests LIKE 'status'");
        if (statusColumns.length === 0) {
            console.log('🔄 Adicionando coluna status...');
            await connection.execute(`
                ALTER TABLE service_requests 
                ADD COLUMN status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending'
            `);
        }

        // 3. Verificar se coluna completed_at já existe
        const [completedColumns] = await connection.execute("SHOW COLUMNS FROM service_requests LIKE 'completed_at'");
        if (completedColumns.length === 0) {
            console.log('🔄 Adicionando coluna completed_at...');
            await connection.execute(`
                ALTER TABLE service_requests
                ADD COLUMN completed_at TIMESTAMP NULL
            `);
        }

        // 4. Criar índices
        console.log('🔄 Criando índices...');
        try {
            await connection.execute('CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id)');
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) throw e;
        }

        try {
            await connection.execute('CREATE INDEX idx_reviews_request_id ON reviews(request_id)');
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) throw e;
        }

        try {
            await connection.execute('CREATE INDEX idx_requests_status ON service_requests(status)');
        } catch (e) {
            if (!e.message.includes('Duplicate key name')) throw e;
        }

        console.log('✅ Migrações aplicadas com sucesso!');

        // Verificar se as tabelas foram criadas
        const [tables] = await connection.execute("SHOW TABLES LIKE 'reviews'");
        if (tables.length > 0) {
            console.log('✅ Tabela reviews criada com sucesso');
        }

        // Verificar se as colunas foram adicionadas
        const [columns] = await connection.execute("DESCRIBE service_requests");
        const hasStatus = columns.some(col => col.Field === 'status');
        const hasCompletedAt = columns.some(col => col.Field === 'completed_at');
        
        if (hasStatus) {
            console.log('✅ Coluna status adicionada à tabela service_requests');
        }
        
        if (hasCompletedAt) {
            console.log('✅ Coluna completed_at adicionada à tabela service_requests');
        }

    } catch (error) {
        console.error('❌ Erro ao aplicar migrações:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    applyReviewsMigration()
        .then(() => {
            console.log('🎉 Migrações concluídas!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha na migração:', error);
            process.exit(1);
        });
}

module.exports = applyReviewsMigration;
