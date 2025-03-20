
# ServAdmin Troubleshooting Guide

This document provides solutions for common issues you might encounter with ServAdmin.

## Service Not Starting

### Check Service Status
```bash
sudo systemctl status servadmin
```

### View Service Logs
```bash
sudo journalctl -u servadmin
```

### Common Issues:
- **Permission problems**: Ensure the servadmin user has access to required directories
- **Port conflicts**: Check if another application is using port 3001
- **Database connection issues**: Verify database credentials in .env file

## Apache Issues

### Check Apache Configuration
```bash
sudo apachectl configtest
```

### View Apache Error Logs
```bash
sudo tail -f /var/log/httpd/servadmin_error.log
```

### Common Apache Issues:

1. **404 Not Found errors**: Check that the DocumentRoot in the Apache configuration points to the correct frontend directory

2. **API requests failing**: Ensure mod_proxy and related modules are enabled:
   ```bash
   sudo httpd -M | grep proxy
   ```

3. **SPA Routing Issues**: Confirm that .htaccess is properly configured and AllowOverride is set to All

4. **WebSocket connection failures**: Verify that mod_proxy_wstunnel is enabled and properly configured

## Database Connection Issues

### Verify Database Credentials
```bash
mysql -u servadmin -p servadmin
```

If you can't connect, try:
```bash
mysql -u root -p
SELECT user, host FROM mysql.user WHERE user='servadmin';
SHOW GRANTS FOR 'servadmin'@'localhost';
```

### Check Authentication Plugin Issues
If using MySQL 5.7, check for authentication plugin issues:
```bash
mysql -u root -p
SELECT user, host, plugin FROM mysql.user WHERE user='servadmin';
```

If the plugin is 'auth_socket', update it:
```sql
ALTER USER 'servadmin'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## Firewall Rules Not Applied

### Check Firewalld Status
```bash
sudo firewall-cmd --list-all
```

### Restart Firewalld
```bash
sudo systemctl restart firewalld
```

### Verify Port Configuration
```bash
sudo firewall-cmd --list-ports
```

## Frontend Issues

### White Screen / Application Not Loading

1. Check browser console for JavaScript errors
2. Verify that the frontend was properly built:
   ```bash
   ls -la /opt/servadmin/frontend
   ```
3. Check Apache logs for any file serving issues
4. Verify that your Apache configuration has proper SPA routing setup

### API Connection Problems

1. Check that the backend service is running:
   ```bash
   sudo systemctl status servadmin
   ```
2. Verify API proxy configuration in Apache:
   ```bash
   grep -A 10 "/api" /etc/httpd/conf.d/servadmin.conf
   ```
3. Check the browser console for CORS or network errors
