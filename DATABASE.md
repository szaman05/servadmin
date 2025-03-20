
# ServAdmin Database Schema

This document details the database schema used by ServAdmin, which is compatible with MySQL 5.7.

## Schema Overview

ServAdmin uses a MySQL 5.7 compatible database with the following structure:

### Users Table
Stores user accounts and authentication information.
```sql
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
```

### Servers Table
Stores information about managed servers.
```sql
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
```

### Server Logs Table
Stores system and application logs.
```sql
CREATE TABLE server_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  server_id INT NOT NULL,
  log_type ENUM('info', 'warning', 'error', 'critical') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);
```

### Firewall Rules Table
Stores firewall rules for allowed IP addresses.
```sql
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
```

### Temporary IP Access Table
Stores temporary IP access entries from the "Allow My IP" feature.
```sql
CREATE TABLE temporary_ip_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  description TEXT,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## MySQL 5.7 Compatibility Notes

- **Single TIMESTAMP with DEFAULT CURRENT_TIMESTAMP**: MySQL 5.7 allows only one TIMESTAMP column per table to have DEFAULT CURRENT_TIMESTAMP or ON UPDATE CURRENT_TIMESTAMP. We use TIMESTAMP for created_at and DATETIME for updated_at.

- **Character Set**: All tables use utf8mb4 character set with utf8mb4_unicode_ci collation for full Unicode support.

## Database Backup

To backup the database (MySQL 5.7 specific options):
```bash
mysqldump --single-transaction --quick --lock-tables=false -u root -p servadmin > /backup/servadmin_$(date +%Y%m%d).sql
```
