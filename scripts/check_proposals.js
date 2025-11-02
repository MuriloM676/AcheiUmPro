require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkProposalsTable() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'acheiuser',
            password: process.env.DB_PASSWORD || 'acheipass',
            database: process.env.DB_NAME || 'acheiumpro'
        });

        console.log('🔍 Verificando estrutura da tabela service_proposals...');
        const [proposalsColumns] = await connection.execute('DESCRIBE service_proposals');
        console.log('Colunas service_proposals:', proposalsColumns.map(c => `${c.Field} (${c.Type})`));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkProposalsTable();
