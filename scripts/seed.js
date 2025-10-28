#!/usr/bin/env node

const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
const DB_USER = process.env.DB_USER || 'acheiuser'
const DB_PASSWORD = process.env.DB_PASSWORD || 'acheipass'
const DB_NAME = process.env.DB_NAME || 'acheiumpro'

async function ensureSchema(connection) {
  await connection.execute(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS status ENUM('active', 'suspended') NOT NULL DEFAULT 'active';
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS provider_availability (
      id INT PRIMARY KEY AUTO_INCREMENT,
      provider_id INT NOT NULL,
      weekday TINYINT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_slot (provider_id, weekday, start_time, end_time)
    ) ENGINE=InnoDB;
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      request_id INT NOT NULL,
      sender_id INT NOT NULL,
      recipient_id INT NOT NULL,
      content TEXT,
      attachment_url TEXT,
      attachment_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_request (request_id)
    ) ENGINE=InnoDB;
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      request_id INT NOT NULL,
      provider_id INT NOT NULL,
      client_id INT NOT NULL,
      scheduled_for DATETIME NOT NULL,
      status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_request (request_id)
    ) ENGINE=InnoDB;
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      request_id INT NOT NULL,
      provider_id INT NOT NULL,
      client_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
      status ENUM('pending', 'awaiting_payment', 'paid', 'refused') NOT NULL DEFAULT 'pending',
      checkout_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_request_payment (request_id)
    ) ENGINE=InnoDB;
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      channel ENUM('webpush', 'email', 'sms', 'in_app') NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      metadata JSON,
      read_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB;
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS provider_verifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      provider_id INT NOT NULL,
      document_type VARCHAR(100) NOT NULL,
      document_url TEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      notes TEXT,
      reviewed_by INT NULL,
      reviewed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notification_subscriptions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_endpoint (endpoint(255))
    ) ENGINE=InnoDB;
  `)
}

async function ensureUser(connection, user) {
  const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email])
  if (rows.length > 0) {
    return rows[0].id
  }

  const hashedPassword = await bcrypt.hash(user.password, 10)
  const [result] = await connection.execute(
    'INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
    [user.name, user.email, hashedPassword, user.role, user.phone ?? null, user.location ?? null]
  )

  return result.insertId
}

async function ensureProviderProfile(connection, userId, profile) {
  const [rows] = await connection.execute('SELECT id FROM providers WHERE user_id = ?', [userId])
  if (rows.length > 0) {
    return rows[0].id
  }

  const [result] = await connection.execute(
    'INSERT INTO providers (user_id, description, photo_url) VALUES (?, ?, ?)',
    [userId, profile.description ?? null, profile.photo_url ?? null]
  )

  return result.insertId
}

async function ensureService(connection, providerId, service) {
  const [rows] = await connection.execute(
    'SELECT id FROM services WHERE provider_id = ? AND name = ?',
    [providerId, service.name]
  )
  if (rows.length > 0) {
    return rows[0].id
  }

  const [result] = await connection.execute(
    'INSERT INTO services (provider_id, name, price) VALUES (?, ?, ?)',
    [providerId, service.name, service.price ?? null]
  )

  return result.insertId
}

async function ensureReview(connection, providerId, clientId, review) {
  const [rows] = await connection.execute(
    'SELECT id FROM reviews WHERE provider_id = ? AND client_id = ?',
    [providerId, clientId]
  )
  if (rows.length > 0) {
    await connection.execute(
      'UPDATE reviews SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
      [review.rating, review.comment ?? null, rows[0].id]
    )
    return rows[0].id
  }

  const [result] = await connection.execute(
    'INSERT INTO reviews (provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?)',
    [providerId, clientId, review.rating, review.comment ?? null]
  )

  return result.insertId
}

async function ensureAdminUser(connection) {
  return ensureUser(connection, {
    name: 'Administrador AcheiUmPro',
    email: 'admin@acheiumpro.com',
    password: 'admin123',
    role: 'admin',
    phone: '(11) 95555-1111',
    location: 'São Paulo - SP'
  })
}

async function ensureAvailability(connection, providerId, weekday, startTime, endTime) {
  await connection.execute(
    `INSERT INTO provider_availability (provider_id, weekday, start_time, end_time)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)` ,
    [providerId, weekday, startTime, endTime]
  )
}

async function ensureAppointment(connection, requestId, providerId, clientId, scheduledFor, status = 'confirmed') {
  await connection.execute(
    `INSERT INTO appointments (request_id, provider_id, client_id, scheduled_for, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE scheduled_for = VALUES(scheduled_for), status = VALUES(status)` ,
    [requestId, providerId, clientId, scheduledFor, status]
  )
}

async function ensureMessage(connection, message) {
  await connection.execute(
    `INSERT INTO messages (request_id, sender_id, recipient_id, content, attachment_url, attachment_type)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    [
      message.request_id,
      message.sender_id,
      message.recipient_id,
      message.content || null,
      message.attachment_url || null,
      message.attachment_type || null
    ]
  )
}

async function ensurePayment(connection, payment) {
  await connection.execute(
    `INSERT INTO payments (request_id, provider_id, client_id, amount, currency, status, checkout_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE amount = VALUES(amount), currency = VALUES(currency), status = VALUES(status), checkout_url = VALUES(checkout_url)` ,
    [
      payment.request_id,
      payment.provider_id,
      payment.client_id,
      payment.amount,
      payment.currency || 'BRL',
      payment.status || 'pending',
      payment.checkout_url || null
    ]
  )
}

async function ensureNotification(connection, notification) {
  await connection.execute(
    `INSERT INTO notifications (user_id, channel, title, body, metadata)
     VALUES (?, ?, ?, ?, JSON_OBJECT('source', ?, 'requestId', ?))` ,
    [
      notification.user_id,
      notification.channel,
      notification.title,
      notification.body,
      notification.source || 'seed',
      notification.request_id || null
    ]
  )
}

async function ensureVerification(connection, providerId, status = 'approved') {
  await connection.execute(
    `INSERT INTO provider_verifications (provider_id, document_type, document_url, status, reviewed_by, reviewed_at)
     VALUES (?, 'identidade', 'https://example.com/documento-demo.pdf', ?, NULL, NULL)
     ON DUPLICATE KEY UPDATE status = VALUES(status)` ,
    [providerId, status]
  )
}

async function main() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  })

  try {
    console.log(`Conectado a ${DB_HOST}:${DB_PORT}/${DB_NAME}`)

    await ensureSchema(connection)

    const clientId = await ensureUser(connection, {
      name: 'Cliente Demo',
      email: 'cliente.demo@acheiumpro.com',
      password: '123456',
      role: 'client',
      phone: '(11) 90000-0000',
      location: 'São Paulo - SP'
    })

    const providerUserId = await ensureUser(connection, {
      name: 'Prestador Demo',
      email: 'prestador.demo@acheiumpro.com',
      password: '123456',
      role: 'provider',
      phone: '(11) 98888-0000',
      location: 'São Paulo - SP'
    })

    const providerId = await ensureProviderProfile(connection, providerUserId, {
      description: 'Especialista em reparos elétricos e serviços residenciais com mais de 10 anos de experiência.',
      photo_url: null
    })

    const eletricServiceId = await ensureService(connection, providerId, {
      name: 'Instalação Elétrica Residencial',
      price: 350.0
    })

    await ensureService(connection, providerId, {
      name: 'Consultoria de Manutenção',
      price: null
    })

    await ensureReview(connection, providerId, clientId, {
      rating: 5,
      comment: 'Serviço excelente, rápido e muito profissional.'
    })

    const [requestResult] = await connection.execute(
      `INSERT INTO requests (client_id, provider_id, service_id, status, description, scheduled_at)
       VALUES (?, ?, ?, 'completed', ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), description = VALUES(description), scheduled_at = VALUES(scheduled_at)`,
      [
        clientId,
        providerId,
        eletricServiceId,
        'Instalação de novos pontos de energia na sala.',
        '2025-01-12 14:00:00'
      ]
    )

    let seededRequestId = requestResult.insertId

    if (!seededRequestId) {
      const [existingRequests] = await connection.execute(
        'SELECT id FROM requests WHERE client_id = ? AND provider_id = ? ORDER BY id DESC LIMIT 1',
        [clientId, providerId]
      )
      if (Array.isArray(existingRequests) && existingRequests.length) {
        seededRequestId = existingRequests[0].id
      }
    }

    if (!seededRequestId) {
      throw new Error('Não foi possível obter o ID da solicitação seed.')
    }

    await ensureAvailability(connection, providerId, 1, '08:00:00', '12:00:00')
    await ensureAvailability(connection, providerId, 3, '13:00:00', '18:00:00')

    await ensureAppointment(connection, seededRequestId, providerId, clientId, '2025-01-12 14:00:00')

    await ensureMessage(connection, {
      request_id: seededRequestId,
      sender_id: clientId,
      recipient_id: providerUserId,
      content: 'Olá, tudo certo para o horário combinado?',
      attachment_url: null,
      attachment_type: null
    })

    await ensurePayment(connection, {
      request_id: seededRequestId,
      provider_id: providerId,
      client_id: clientId,
      amount: 450.0,
      status: 'paid',
      checkout_url: 'https://checkout.demo/123'
    })

    await ensureNotification(connection, {
      user_id: providerUserId,
      channel: 'in_app',
      title: 'Novo pagamento recebido',
      body: 'O cliente confirmou o pagamento do serviço concluído.',
      source: 'seed',
      request_id: seededRequestId
    })

    await ensureVerification(connection, providerId, 'approved')

    const adminId = await ensureAdminUser(connection)

    await ensureNotification(connection, {
      user_id: adminId,
      channel: 'email',
      title: 'Resumo diário (demo)',
      body: 'Há novos prestadores aguardando verificação.',
      source: 'seed'
    })

    console.log('Base de dados populada com dados de demonstração.')
  } finally {
    await connection.end()
  }
}

main().catch((err) => {
  console.error('Erro durante execução do seed:', err)
  process.exit(1)
})
