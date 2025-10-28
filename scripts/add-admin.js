// Script para adicionar usuário admin padrão
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Iniciando criação do usuário admin padrão...');
  
  // Configuração da conexão
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'acheiuser',
    password: 'acheipass',
    database: 'acheiumpro',
  });

  try {
    // Verificar se o usuário admin já existe
    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', ['admin@acheiumpro.com']);
    
    if (rows.length > 0) {
      console.log('Usuário admin já existe. Atualizando senha...');
      
      // Atualizar a senha do admin existente
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'UPDATE users SET password = ?, role = "admin" WHERE email = ?',
        [hashedPassword, 'admin@acheiumpro.com']
      );
      
      console.log('Senha do usuário admin atualizada com sucesso!');
    } else {
      console.log('Criando novo usuário admin...');
      
      // Criar novo usuário admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        ['Administrador', 'admin@acheiumpro.com', hashedPassword, 'admin', 'active']
      );
      
      console.log('Usuário admin criado com sucesso!');
    }
    
    console.log('Credenciais do admin:');
    console.log('Email: admin@acheiumpro.com');
    console.log('Senha: admin123');
    
  } catch (error) {
    console.error('Erro ao configurar usuário admin:', error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);