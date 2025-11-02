require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkDatabase() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'acheiuser',
            password: process.env.DB_PASSWORD || 'acheipass',
            database: process.env.DB_NAME || 'acheiumpro'
        });

        console.log('🔍 Verificando tabelas existentes...');
        
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tabelas existentes:', tables.map(t => Object.values(t)[0]));

        console.log('\n🔍 Verificando estrutura da tabela service_requests...');
        const [serviceColumns] = await connection.execute('DESCRIBE service_requests');
        console.log('Colunas service_requests:', serviceColumns.map(c => c.Field));

        console.log('\n🔍 Verificando se tabela reviews existe...');
        const [reviewsTables] = await connection.execute("SHOW TABLES LIKE 'reviews'");
        if (reviewsTables.length > 0) {
            console.log('Tabela reviews existe');
            const [reviewsColumns] = await connection.execute('DESCRIBE reviews');
            console.log('Colunas reviews:', reviewsColumns.map(c => c.Field));
        } else {
            console.log('Tabela reviews NÃO existe');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkDatabase();
