
# ServAdmin Installation Guide

This guide will walk you through installing the ServAdmin application on a CentOS 7 server with MySQL 5.7.

## Prerequisites

- A CentOS 7 server with root access
- Minimum system requirements:
  - 2 CPU cores
  - 2GB RAM
  - 20GB disk space
- Internet access for package installation

## Installation Steps

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

## MySQL 5.7 Installation (Optional)

If you need to use MySQL 5.7 specifically (instead of MariaDB installed by default):

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
