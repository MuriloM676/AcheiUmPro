-- Create additional tables required by the app
USE `acheiumpro`;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  content TEXT,
  attachment_url VARCHAR(512),
  attachment_type VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  channel ENUM('webpush','email','sms','in_app') NOT NULL DEFAULT 'in_app',
  title VARCHAR(191) NOT NULL,
  body TEXT,
  metadata JSON DEFAULT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notification subscriptions (WebPush)
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint VARCHAR(1000) NOT NULL,
  p256dh VARCHAR(512) NOT NULL,
  auth VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_endpoint_unique (user_id, endpoint(255)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATETIME NOT NULL,
  client_id INT NOT NULL,
  provider_id INT NOT NULL,
  request_id INT DEFAULT NULL,
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Provider availability (recurring weekly slots)
CREATE TABLE IF NOT EXISTS provider_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  weekday TINYINT NOT NULL COMMENT '0=Sunday..6=Saturday',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (provider_id),
  INDEX (weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
