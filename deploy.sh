
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
yum install -y nodejs npm mariadb mariadb-server nginx firewalld git

# Configure and start MariaDB
echo "Configuring MariaDB..."
systemctl enable mariadb
systemctl start mariadb

# Create database and user
echo "Setting up database..."
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
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

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/conf.d/servadmin.conf << EOF
server {
    listen 80;
    server_name _;

    root $FRONTEND_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

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
systemctl enable nginx
systemctl restart nginx
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
