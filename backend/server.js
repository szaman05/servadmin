
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { exec } = require('child_process');
const { promisify } = require('util');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Promisify exec
const execPromise = promisify(exec);

// ROUTES

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const user = users[0];
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Update last login time
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRATION }
    );
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        lastLogin: user.last_login
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Server stats - Real-time monitoring
app.get('/api/servers/stats', authenticateToken, async (req, res) => {
  try {
    // Here we'll execute various system commands to get server stats
    const [cpuInfo, memInfo, diskInfo, networkInfo, uptimeInfo, loadAvg, services] = await Promise.all([
      execPromise("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'"),
      execPromise("free -m | grep Mem"),
      execPromise("df -h / | tail -1"),
      execPromise("cat /proc/net/dev | grep eth0"),
      execPromise("cat /proc/uptime"),
      execPromise("cat /proc/loadavg"),
      execPromise("systemctl list-units --type=service --state=running,failed,exited | grep .service | head -10")
    ]);

    // Parse the results
    const cpuUsage = parseFloat(cpuInfo.stdout);
    
    const memParts = memInfo.stdout.trim().split(/\s+/);
    const totalMem = parseInt(memParts[1]);
    const usedMem = parseInt(memParts[2]);
    const cachedMem = parseInt(memParts[5]);
    
    const diskParts = diskInfo.stdout.trim().split(/\s+/);
    const totalDisk = diskParts[1];
    const usedDisk = diskParts[2];
    const diskPercentage = diskParts[4].replace('%', '');
    
    const networkParts = networkInfo.stdout.trim().split(/\s+/);
    const rxBytes = parseInt(networkParts[1]);
    const txBytes = parseInt(networkParts[9]);
    
    const uptime = parseFloat(uptimeInfo.stdout.split(' ')[0]);
    const loadAvgValues = loadAvg.stdout.trim().split(' ').slice(0, 3).map(parseFloat);
    
    // Parse service information
    const serviceLines = services.stdout.trim().split('\n');
    const parsedServices = serviceLines.map(line => {
      const parts = line.trim().split(/\s+/);
      const status = parts[3] === 'running' ? 'running' : 
                     parts[3] === 'exited' ? 'stopped' : 'restarting';
      return {
        name: parts[0].replace('.service', ''),
        status,
        uptime: Math.floor(Math.random() * 86400) // Random uptime for demo purposes
      };
    });
    
    const stats = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuUsage,
        cores: 4, // This would come from a different command in production
        temperature: 45 + Math.floor(Math.random() * 10) // Simulated for demo
      },
      memory: {
        total: totalMem,
        used: usedMem,
        cache: cachedMem
      },
      disk: {
        total: parseInt(totalDisk.replace('G', '')),
        used: parseInt(usedDisk.replace('G', '')),
        read: Math.floor(Math.random() * 50), // Simulated for demo
        write: Math.floor(Math.random() * 30) // Simulated for demo
      },
      network: {
        interfaces: [
          {
            name: 'eth0',
            ipAddress: '192.168.1.10',
            rx: rxBytes / (1024 * 1024), // Convert to MB
            tx: txBytes / (1024 * 1024)  // Convert to MB
          }
        ]
      },
      services: parsedServices,
      uptime: uptime,
      load: loadAvgValues
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching server stats:', error);
    res.status(500).json({ message: 'Failed to fetch server stats', error: error.message });
  }
});

// Firewall Rules
app.get('/api/firewall/rules', authenticateToken, async (req, res) => {
  try {
    const [rules] = await pool.query(`
      SELECT fr.*, u.username as created_by_username 
      FROM firewall_rules fr
      JOIN users u ON fr.created_by = u.id
      ORDER BY fr.id DESC
    `);
    
    res.json(rules);
  } catch (error) {
    console.error('Error fetching firewall rules:', error);
    res.status(500).json({ message: 'Failed to fetch firewall rules', error: error.message });
  }
});

app.post('/api/firewall/rules', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { sourceIp, description, enabled } = req.body;
    
    // Validate IP format
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
    if (!ipRegex.test(sourceIp)) {
      return res.status(400).json({ message: 'Invalid IP address format' });
    }
    
    // Add rule to database
    const [result] = await pool.query(
      'INSERT INTO firewall_rules (source_ip, description, enabled, created_by) VALUES (?, ?, ?, ?)',
      [sourceIp, description, enabled ? 1 : 0, req.user.id]
    );
    
    // Execute firewalld command if rule is enabled
    if (enabled) {
      const command = `firewall-cmd --permanent --zone=public --add-source=${sourceIp}`;
      await execPromise(command);
      await execPromise('firewall-cmd --reload');
    }
    
    const newRule = {
      id: result.insertId,
      sourceIp,
      description,
      enabled: enabled ? 1 : 0,
      created_by: req.user.id,
      created_by_username: req.user.username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error adding firewall rule:', error);
    res.status(500).json({ message: 'Failed to add firewall rule', error: error.message });
  }
});

app.put('/api/firewall/rules/:id', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceIp, description, enabled } = req.body;
    
    // Validate IP format
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
    if (!ipRegex.test(sourceIp)) {
      return res.status(400).json({ message: 'Invalid IP address format' });
    }
    
    // Get current rule
    const [currentRules] = await pool.query('SELECT * FROM firewall_rules WHERE id = ?', [id]);
    if (currentRules.length === 0) {
      return res.status(404).json({ message: 'Firewall rule not found' });
    }
    
    const currentRule = currentRules[0];
    
    // Update rule in database
    await pool.query(
      'UPDATE firewall_rules SET source_ip = ?, description = ?, enabled = ? WHERE id = ?',
      [sourceIp, description, enabled ? 1 : 0, id]
    );
    
    // Execute firewalld commands based on changes
    if (currentRule.source_ip !== sourceIp) {
      // Remove old IP if it exists
      if (currentRule.enabled) {
        await execPromise(`firewall-cmd --permanent --zone=public --remove-source=${currentRule.source_ip}`);
      }
      
      // Add new IP if enabled
      if (enabled) {
        await execPromise(`firewall-cmd --permanent --zone=public --add-source=${sourceIp}`);
      }
    } else if (currentRule.enabled !== enabled) {
      // Just toggle the existing IP
      if (enabled) {
        await execPromise(`firewall-cmd --permanent --zone=public --add-source=${sourceIp}`);
      } else {
        await execPromise(`firewall-cmd --permanent --zone=public --remove-source=${sourceIp}`);
      }
    }
    
    // Reload firewalld if any changes were made
    if (currentRule.source_ip !== sourceIp || currentRule.enabled !== enabled) {
      await execPromise('firewall-cmd --reload');
    }
    
    res.json({
      id: parseInt(id),
      sourceIp,
      description,
      enabled: enabled ? 1 : 0,
      created_by: currentRule.created_by,
      created_at: currentRule.created_at,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating firewall rule:', error);
    res.status(500).json({ message: 'Failed to update firewall rule', error: error.message });
  }
});

app.delete('/api/firewall/rules/:id', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get rule to delete
    const [rules] = await pool.query('SELECT * FROM firewall_rules WHERE id = ?', [id]);
    if (rules.length === 0) {
      return res.status(404).json({ message: 'Firewall rule not found' });
    }
    
    const rule = rules[0];
    
    // Remove rule from firewalld if it's enabled
    if (rule.enabled) {
      await execPromise(`firewall-cmd --permanent --zone=public --remove-source=${rule.source_ip}`);
      await execPromise('firewall-cmd --reload');
    }
    
    // Delete from database
    await pool.query('DELETE FROM firewall_rules WHERE id = ?', [id]);
    
    res.json({ message: 'Firewall rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting firewall rule:', error);
    res.status(500).json({ message: 'Failed to delete firewall rule', error: error.message });
  }
});

// "Allow My IP" feature
app.post('/api/firewall/allow-my-ip', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;
    
    // Get the user's public IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ip = data.ip;
    
    // Set expiration time (24 hours from now)
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    // Add to temporary_ip_access table
    const [result] = await pool.query(
      'INSERT INTO temporary_ip_access (user_id, ip_address, description, expires_at) VALUES (?, ?, ?, ?)',
      [req.user.id, ip, description, expires]
    );
    
    // Add to firewalld
    await execPromise(`firewall-cmd --permanent --zone=public --add-source=${ip}`);
    await execPromise('firewall-cmd --reload');
    
    res.status(201).json({
      id: result.insertId,
      ip_address: ip,
      description,
      expires_at: expires.toISOString(),
      message: 'Your IP has been allowed for 24 hours'
    });
  } catch (error) {
    console.error('Error allowing IP:', error);
    res.status(500).json({ message: 'Failed to allow IP', error: error.message });
  }
});

// Server Control - start, stop, restart services
app.post('/api/server/control/:action', authenticateToken, authorize(['admin', 'operator']), async (req, res) => {
  try {
    const { action } = req.params;
    const { service } = req.body;
    
    // Validate service name to prevent injection (simple validation)
    if (!service.match(/^[a-zA-Z0-9\-_.]+$/)) {
      return res.status(400).json({ message: 'Invalid service name' });
    }
    
    let command;
    switch (action) {
      case 'start':
        command = `systemctl start ${service}`;
        break;
      case 'stop':
        command = `systemctl stop ${service}`;
        break;
      case 'restart':
        command = `systemctl restart ${service}`;
        break;
      case 'status':
        command = `systemctl status ${service}`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    const { stdout, stderr } = await execPromise(command);
    
    // Add to server logs
    await pool.query(
      'INSERT INTO server_logs (server_id, log_type, message) VALUES (?, ?, ?)',
      [1, 'info', `User ${req.user.username} executed ${action} on ${service}: ${stdout}`]
    );
    
    res.json({
      action,
      service,
      stdout,
      stderr,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error ${req.params.action} service:`, error);
    
    // Add to server logs
    await pool.query(
      'INSERT INTO server_logs (server_id, log_type, message) VALUES (?, ?, ?)',
      [1, 'error', `User ${req.user.username} failed to execute ${req.params.action} on ${req.body.service}: ${error.message}`]
    );
    
    res.status(500).json({ message: `Failed to ${req.params.action} service`, error: error.message });
  }
});

// Users management (admin only)
app.get('/api/users', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, role, email, last_login, created_at, updated_at FROM users'
    );
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

app.post('/api/users', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { username, password, role, email } = req.body;
    
    // Basic validation
    if (!username || !password || !role || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if username exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
      [username, passwordHash, role, email]
    );
    
    const newUser = {
      id: result.insertId,
      username,
      role,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

// Server Logs
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const [logs] = await pool.query(
      'SELECT * FROM server_logs ORDER BY created_at DESC LIMIT 100'
    );
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket');
  
  // Authenticate the WebSocket connection
  socket.on('authenticate', async (token) => {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      
      socket.user = user;
      socket.join(`user-${user.id}`);
      
      console.log(`User ${user.username} authenticated on WebSocket`);
      
      // Set up real-time stats polling
      const statsInterval = setInterval(async () => {
        try {
          // Get server stats (similar to the /api/servers/stats endpoint)
          const [cpuInfo, memInfo, diskInfo] = await Promise.all([
            execPromise("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'"),
            execPromise("free -m | grep Mem"),
            execPromise("df -h / | tail -1")
          ]);
          
          // Parse and emit stats
          // (Simplified for example - in production, would be more comprehensive)
          const cpuUsage = parseFloat(cpuInfo.stdout);
          
          const memParts = memInfo.stdout.trim().split(/\s+/);
          const totalMem = parseInt(memParts[1]);
          const usedMem = parseInt(memParts[2]);
          
          const diskParts = diskInfo.stdout.trim().split(/\s+/);
          const diskPercentage = diskParts[4].replace('%', '');
          
          socket.emit('server-stats', {
            timestamp: new Date().toISOString(),
            cpu: cpuUsage,
            memory: {
              total: totalMem,
              used: usedMem,
              percentage: (usedMem / totalMem * 100).toFixed(1)
            },
            disk: {
              percentage: diskPercentage
            }
          });
        } catch (error) {
          console.error('Error fetching real-time stats:', error);
        }
      }, 5000); // Update every 5 seconds
      
      socket.on('disconnect', () => {
        clearInterval(statsInterval);
        console.log(`User ${user.username} disconnected from WebSocket`);
      });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.disconnect();
    }
  });
});

// Schedule task to clean up expired temporary IP access
const cleanupExpiredIPs = async () => {
  try {
    // Get expired IP entries
    const [expiredIPs] = await pool.query(
      'SELECT * FROM temporary_ip_access WHERE expires_at < NOW()'
    );
    
    for (const ip of expiredIPs) {
      // Remove from firewalld
      await execPromise(`firewall-cmd --permanent --zone=public --remove-source=${ip.ip_address}`);
      
      // Delete from database
      await pool.query('DELETE FROM temporary_ip_access WHERE id = ?', [ip.id]);
      
      console.log(`Removed expired temporary IP: ${ip.ip_address}`);
    }
    
    // Reload firewalld if any IPs were removed
    if (expiredIPs.length > 0) {
      await execPromise('firewall-cmd --reload');
    }
  } catch (error) {
    console.error('Error cleaning up expired IPs:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredIPs, 60 * 60 * 1000);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
