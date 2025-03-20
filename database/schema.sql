
-- ServAdmin Database Schema (MySQL 5.7 compatible)

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'operator', 'viewer') NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Servers Table
CREATE TABLE servers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  description TEXT,
  status ENUM('running', 'stopped', 'restarting', 'unknown') DEFAULT 'unknown',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Server Logs Table
CREATE TABLE server_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  server_id INT NOT NULL,
  log_type ENUM('info', 'warning', 'error', 'critical') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Firewall Rules Table
CREATE TABLE firewall_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_ip VARCHAR(45) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Temporary IP Access Table (for "Allow My IP" feature)
CREATE TABLE temporary_ip_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  description TEXT,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role, email) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'admin@example.com');

-- Insert default operator user (password: operator123)
INSERT INTO users (username, password_hash, role, email) 
VALUES ('operator', '$2y$10$OUuG/Vh4UqNwKvM/fJKize3k8BQlF0JE1fUYuC9BhPsPvYLDCfyX.', 'operator', 'operator@example.com');

-- Insert default viewer user (password: viewer123)
INSERT INTO users (username, password_hash, role, email) 
VALUES ('viewer', '$2y$10$riFkqVLGKGHUFuFNb.4XR.m8DfCEQAjZDHZbpcpVX9eKxCTyIPBAq', 'viewer', 'viewer@example.com');
