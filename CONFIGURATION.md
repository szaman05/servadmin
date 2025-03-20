
# ServAdmin Configuration Guide

This guide explains the configuration options for the ServAdmin application.

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

### Manual Apache Configuration

If you need to set up Apache manually, create a configuration file at `/etc/httpd/conf.d/servadmin.conf` with the following content:

```apache
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /opt/servadmin/frontend
    
    <Directory /opt/servadmin/frontend>
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
```

## MySQL 5.7 Compatibility

ServAdmin is compatible with MySQL 5.7. Important compatibility details:

1. **Character Set**: The database uses `utf8mb4` with `utf8mb4_unicode_ci` collation for full Unicode support.

2. **Timestamp Columns**: The schema uses only one TIMESTAMP column with CURRENT_TIMESTAMP per table (usually the created_at column). The updated_at column uses DATETIME type with ON UPDATE CURRENT_TIMESTAMP to avoid the MySQL 5.7 limitation.

## Environment Variables

The backend application is configured through environment variables in the `.env` file:

```
PORT=3001
NODE_ENV=production

JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

DB_HOST=localhost
DB_PORT=3306
DB_NAME=servadmin
DB_USER=servadmin
DB_PASSWORD=your_db_password

SSH_PORT=22
SSH_PASSPHRASE=
```

Key variables:
- `PORT`: The port on which the backend server runs
- `JWT_SECRET`: Secret key for signing JWT tokens
- `DB_*`: Database connection parameters
- `SSH_*`: SSH connection parameters for server management features
