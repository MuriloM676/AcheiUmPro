const mysql = require('mysql2/promise');

async function createServiceTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'acheiuser',
    password: 'acheipass',
    database: 'acheiumpro'
  });

  const queries = [
    `CREATE TABLE IF NOT EXISTS service_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      location VARCHAR(255) NOT NULL,
      budget VARCHAR(100),
      urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
      status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_category (category),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS service_proposals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      provider_id INT NOT NULL,
      proposed_price DECIMAL(10,2) NOT NULL,
      message TEXT,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_provider_request (request_id, provider_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'`
  ];

  try {
    for (const query of queries) {
      console.log('Executing:', query.substring(0, 50) + '...');
      await connection.execute(query);
    }
    console.log('Service platform tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await connection.end();
  }
}

createServiceTables();
