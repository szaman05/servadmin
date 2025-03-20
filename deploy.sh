
#!/bin/bash

# ServAdmin Deployment Script
echo "Starting ServAdmin deployment..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

# Set variables
APP_DIR="/opt/servadmin"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DB_USER="servadmin"
DB_PASS="$(openssl rand -base64 12)"
DB_NAME="servadmin"
JWT_SECRET="$(openssl rand -base64 32)"

# Create directories
echo "Creating application directories..."
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR

# Install dependencies
echo "Installing system dependencies..."
yum update -y
yum install -y epel-release
yum install -y nodejs npm mariadb mariadb-server httpd firewalld git

# Configure and start MariaDB
echo "Configuring MariaDB..."
systemctl enable mariadb
systemctl start mariadb

# Create database and user
echo "Setting up database..."
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Import schema
echo "Importing database schema..."
mysql $DB_NAME < database/schema.sql

# Set up backend
echo "Setting up backend..."
cp -r backend/* $BACKEND_DIR/
cd $BACKEND_DIR
npm install

# Create .env file
cat > $BACKEND_DIR/.env << EOF
PORT=3001
NODE_ENV=production

JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=24h

DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

SSH_PORT=22
SSH_PASSPHRASE=
EOF

# Build frontend
echo "Building frontend..."
npm run build
cp -r dist/* $FRONTEND_DIR/

# Configure Apache
echo "Configuring Apache HTTP Server..."
cat > /etc/httpd/conf.d/servadmin.conf << EOF
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot $FRONTEND_DIR
    
    <Directory $FRONTEND_DIR>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Backend API Proxy
    ProxyRequests Off
    ProxyPreserveHost On
    
    <Location /api>
        ProxyPass http://localhost:3001/api
        ProxyPassReverse http://localhost:3001/api
    </Location>
    
    # WebSocket Proxy
    <Location /socket.io>
        ProxyPass http://localhost:3001/socket.io
        ProxyPassReverse http://localhost:3001/socket.io
        
        # WebSocket support
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} =websocket [NC]
        RewriteRule /(.*) ws://localhost:3001/$1 [P,L]
    </Location>
    
    ErrorLog /var/log/httpd/servadmin_error.log
    CustomLog /var/log/httpd/servadmin_access.log combined
</VirtualHost>
EOF

# Create .htaccess for SPA routing
echo "Creating .htaccess for SPA routing..."
cat > $FRONTEND_DIR/.htaccess << EOF
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

# Enable required Apache modules
echo "Enabling required Apache modules..."
# Check if mod_proxy is installed
if [ -f /etc/httpd/modules/mod_proxy.so ]; then
    # Enable modules
    cat > /etc/httpd/conf.modules.d/00-proxy.conf << EOF
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule rewrite_module modules/mod_rewrite.so
EOF
else
    echo "WARNING: Required Apache modules might not be available. Please ensure mod_proxy, mod_proxy_http, mod_proxy_wstunnel, and mod_rewrite are installed."
fi

# Create systemd service for backend
echo "Creating backend service..."
cat > /etc/systemd/system/servadmin.service << EOF
[Unit]
Description=ServAdmin Backend
After=network.target mariadb.service

[Service]
Type=simple
User=root
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall
echo "Configuring firewall..."
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --zone=public --add-service=http
firewall-cmd --permanent --zone=public --add-service=https
firewall-cmd --reload

# Enable and start services
echo "Starting services..."
systemctl enable httpd
systemctl start httpd
systemctl enable servadmin
systemctl start servadmin

# Print completion message
echo "---------------------------------------------"
echo "ServAdmin installation complete!"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASS"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "Access the application at: http://your-server-ip"
echo "Default login: admin / admin123"
echo "---------------------------------------------"
echo "IMPORTANT: Change the default passwords immediately!"
echo "---------------------------------------------"
