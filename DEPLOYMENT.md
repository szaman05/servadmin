
# ServAdmin Deployment Guide

This guide will walk you through deploying the ServAdmin application on a CentOS 7 server with MySQL 5.7.

## Prerequisites

- A CentOS 7 server with root access
- Minimum system requirements:
  - 2 CPU cores
  - 2GB RAM
  - 20GB disk space
- Internet access for package installation

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/servadmin.git
cd servadmin
```

### 2. Run the Deployment Script

The deployment script will:
- Install required packages (Node.js, MariaDB/MySQL, Apache HTTP Server)
- Set up the database with the schema
- Configure the backend with environment variables
- Build and deploy the frontend
- Set up systemd services
- Configure the firewall

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

### 3. Verify Installation

After the deployment completes, you should see information about the database credentials and JWT secret. Make sure to save this information securely.

Access the application in your browser:

```
http://your-server-ip
```

Log in with the default credentials:
- Username: admin
- Password: admin123

### 4. Security Configuration

For production use, complete these additional security steps:

1. **Change default passwords**:
   - Log in as admin
   - Go to Users section
   - Update passwords for all default accounts

2. **Set up HTTPS**:
   ```bash
   sudo yum install -y certbot python-certbot-apache
   sudo certbot --apache -d yourdomain.com
   ```

3. **Secure the database**:
   ```bash
   sudo mysql_secure_installation
   ```

4. **Configure regular backups**:
   ```bash
   # Add to crontab (run 'crontab -e')
   0 2 * * * mysqldump -u root -p servadmin > /backup/servadmin_$(date +\%Y\%m\%d).sql
   ```

## Apache Configuration

The deployment script configures Apache with the following features:

1. **Static file serving** - Serves the React frontend from `/opt/servadmin/frontend`
2. **API proxying** - Forwards `/api` requests to the Node.js backend
3. **WebSocket support** - Configures proper WebSocket proxying for real-time features
4. **SPA routing** - Uses .htaccess with mod_rewrite to support client-side routing

Apache modules required:
- mod_proxy
- mod_proxy_http
- mod_proxy_wstunnel
- mod_rewrite

If you need to manually configure Apache, the configuration is located at:
```
/etc/httpd/conf.d/servadmin.conf
```

## MySQL 5.7 Compatibility

This application is compatible with MySQL 5.7. If you're using a different MySQL version (like MariaDB), the deployment should still work, but for MySQL 5.7 specifically:

1. **Character Set**: The database uses `utf8mb4` with `utf8mb4_unicode_ci` collation for full Unicode support.

2. **Timestamp Columns**: The schema uses only one TIMESTAMP column with CURRENT_TIMESTAMP per table (usually the created_at column). The updated_at column uses DATETIME type with ON UPDATE CURRENT_TIMESTAMP to avoid the MySQL 5.7 limitation.

3. **If using MySQL 5.7 from official repositories**:
   ```bash
   # Replace MariaDB with MySQL 5.7
   sudo yum remove mariadb mariadb-server
   sudo yum install https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
   sudo yum install mysql-community-server
   sudo systemctl start mysqld
   
   # Get the temporary root password
   sudo grep 'temporary password' /var/log/mysqld.log
   
   # Secure the installation
   sudo mysql_secure_installation
   ```

## Database Schema

The application uses a MySQL 5.7 compatible database with the following schema:

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

## Troubleshooting

### Service Not Starting
Check service status:
```bash
sudo systemctl status servadmin
```

View logs:
```bash
sudo journalctl -u servadmin
```

### Apache Issues
Check Apache configuration:
```bash
sudo apachectl configtest
```

View Apache error logs:
```bash
sudo tail -f /var/log/httpd/servadmin_error.log
```

### Database Connection Issues
Verify database credentials:
```bash
mysql -u servadmin -p servadmin
```

If using MySQL 5.7, check for any authentication plugin issues:
```bash
mysql -u root -p
SELECT user, host, plugin FROM mysql.user WHERE user='servadmin';
```

If the plugin is 'auth_socket', update it:
```sql
ALTER USER 'servadmin'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Firewall Rules Not Applied
Check firewalld status:
```bash
sudo firewall-cmd --list-all
```

Restart firewalld:
```bash
sudo systemctl restart firewalld
```

## Maintenance

### Backup
Regular backups of the database are essential:
```bash
mysqldump -u root -p servadmin > /backup/servadmin_$(date +%Y%m%d).sql
```

For MySQL 5.7 specific options:
```bash
mysqldump --single-transaction --quick --lock-tables=false -u root -p servadmin > /backup/servadmin_$(date +%Y%m%d).sql
```

### Updating
To update the application:
1. Pull the latest code
2. Run the build process
3. Restart the service
```bash
cd /opt/servadmin
git pull
npm run build
sudo systemctl restart servadmin
```

## Support
For issues or questions, please open an issue on the GitHub repository or contact the development team.
