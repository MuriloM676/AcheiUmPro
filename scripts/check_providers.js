require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkProviders() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'acheiuser',
            password: process.env.DB_PASSWORD || 'acheipass',
            database: process.env.DB_NAME || 'acheiumpro'
        });

        console.log('🔍 Verificando tabela providers...');
        const [providers] = await connection.execute('SELECT * FROM providers');
        console.log('Providers:', providers);

        console.log('\n🔍 Verificando tabela users...');
        const [users] = await connection.execute('SELECT * FROM users');
        console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkProviders();
