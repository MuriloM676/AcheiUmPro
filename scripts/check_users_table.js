const mysql = require('mysql2/promise');

async function checkUsersTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'acheiuser',
    password: 'acheipass',
    database: 'acheiumpro'
  });

  try {
    const [rows] = await connection.execute('DESCRIBE users');
    console.log('Estrutura da tabela users:');
    console.table(rows);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

checkUsersTable();
