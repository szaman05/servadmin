
# ServAdmin Maintenance Guide

This document provides guidance on maintaining and updating your ServAdmin installation.

## Regular Maintenance Tasks

### Database Backups

Regular backups of the database are essential:
```bash
mysqldump -u root -p servadmin > /backup/servadmin_$(date +%Y%m%d).sql
```

For MySQL 5.7 specific options:
```bash
mysqldump --single-transaction --quick --lock-tables=false -u root -p servadmin > /backup/servadmin_$(date +%Y%m%d).sql
```

Configure automated daily backups:
```bash
# Add to crontab (run 'crontab -e')
0 2 * * * mysqldump -u root -p servadmin > /backup/servadmin_$(date +\%Y\%m\%d).sql
```

### Log Rotation

Apache logs are located at:
- `/var/log/httpd/servadmin_error.log`
- `/var/log/httpd/servadmin_access.log`

Ensure log rotation is configured to prevent disk space issues:
```bash
sudo vi /etc/logrotate.d/httpd
```

### System Updates

Keep the system updated:
```bash
sudo yum update -y
```

## Updating ServAdmin

To update the application:

1. Pull the latest code
   ```bash
   cd /opt/servadmin
   git pull
   ```

2. Update dependencies
   ```bash
   cd /opt/servadmin/backend
   npm install
   ```

3. Run the build process
   ```bash
   npm run build
   ```

4. Restart the service
   ```bash
   sudo systemctl restart servadmin
   ```

## Monitoring

### Service Status

Check the service status:
```bash
sudo systemctl status servadmin
sudo systemctl status httpd
sudo systemctl status mariadb
```

### Database Health

Check database health:
```bash
mysqlcheck -u root -p --auto-repair --optimize servadmin
```

### Disk Space

Monitor disk space usage:
```bash
df -h
du -sh /opt/servadmin
du -sh /var/log/httpd
```

## Performance Tuning

### Apache Performance

Optimize Apache for better performance:
```bash
sudo vi /etc/httpd/conf/httpd.conf
```

Key settings to adjust:
- MPM worker or event model
- KeepAlive settings
- MaxRequestWorkers

### Database Performance

Optimize MySQL/MariaDB:
```bash
sudo vi /etc/my.cnf
```

Key settings:
- innodb_buffer_pool_size
- max_connections
- query_cache_size

## Support

For issues or questions, please open an issue on the GitHub repository or contact the development team.
