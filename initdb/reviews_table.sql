-- Tabela para sistema de avaliações
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

    -- Evita múltiplas avaliações do mesmo usuário para o mesmo request
    UNIQUE KEY unique_review (request_id, reviewer_id, review_type)
);

-- Adicionar coluna de status para service_requests se não existir
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending';

-- Adicionar coluna completed_at para service_requests se não existir
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request_id ON reviews(request_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
