
import { User, FirewallRule, ServerStats } from "@/types";

// Mock users with encrypted passwords (in a real app, passwords would be hashed)
export const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    password: "$2a$10$XQxJT3jJH/1QlAVDgd0G6OljIKxJFB5LD9PX8pZkDlGfNJ/NXqjAa", // "admin123"
    role: "admin",
    email: "admin@example.com",
    lastLogin: "2023-09-01T10:30:00Z",
  },
  {
    id: 2,
    username: "operator",
    password: "$2a$10$yHJ1xhDBDyBdeo7.UBxXD.PSYdcr2FynqZ6cATpxl2rK8HN6U.TQy", // "operator123"
    role: "operator",
    email: "operator@example.com",
    lastLogin: "2023-09-05T14:20:00Z",
  },
  {
    id: 3,
    username: "viewer",
    password: "$2a$10$h3vYOI03sCNxGfEqQVwr2OPw7MQSjteZJL.GrCdx7gbWFJlxzH8Dy", // "viewer123"
    role: "viewer",
    email: "viewer@example.com",
    lastLogin: "2023-09-10T09:15:00Z",
  },
];

// Mock firewall rules
export const mockFirewallRules: FirewallRule[] = [
  {
    id: 1,
    sourceIp: "192.168.1.100",
    port: 22,
    protocol: "tcp",
    description: "SSH access from admin workstation",
    enabled: true,
    createdAt: "2023-08-15T10:00:00Z",
    updatedAt: "2023-08-15T10:00:00Z",
  },
  {
    id: 2,
    sourceIp: "10.0.0.0/24",
    port: 80,
    protocol: "tcp",
    description: "HTTP access from internal network",
    enabled: true,
    createdAt: "2023-08-15T10:05:00Z",
    updatedAt: "2023-08-20T14:30:00Z",
  },
  {
    id: 3,
    sourceIp: "10.0.0.0/24",
    port: 443,
    protocol: "tcp",
    description: "HTTPS access from internal network",
    enabled: true,
    createdAt: "2023-08-15T10:10:00Z",
    updatedAt: "2023-08-20T14:30:00Z",
  },
  {
    id: 4,
    sourceIp: "203.0.113.0/24",
    port: 3306,
    protocol: "tcp",
    description: "MySQL access from partner network",
    enabled: false,
    createdAt: "2023-08-16T09:00:00Z",
    updatedAt: "2023-09-01T11:20:00Z",
  },
];

// Function to generate random server stats
export function generateServerStats(): ServerStats {
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: Math.floor(Math.random() * 100),
      cores: 4,
      temperature: 40 + Math.floor(Math.random() * 20),
    },
    memory: {
      total: 16384, // MB
      used: 4096 + Math.floor(Math.random() * 8192), // Random between 4GB and 12GB
      cache: 2048 + Math.floor(Math.random() * 2048),
    },
    disk: {
      total: 500 * 1024, // 500 GB in MB
      used: 100 * 1024 + Math.floor(Math.random() * 200 * 1024), // Between 100GB and 300GB
      read: 20 + Math.floor(Math.random() * 80), // MB/s
      write: 10 + Math.floor(Math.random() * 40), // MB/s
    },
    network: {
      interfaces: [
        {
          name: "eth0",
          ipAddress: "192.168.1.10",
          rx: 50 + Math.floor(Math.random() * 150), // MB/s
          tx: 20 + Math.floor(Math.random() * 80), // MB/s
        },
        {
          name: "eth1",
          ipAddress: "10.0.0.10",
          rx: 10 + Math.floor(Math.random() * 50), // MB/s
          tx: 5 + Math.floor(Math.random() * 30), // MB/s
        },
      ],
    },
    services: [
      {
        name: "httpd",
        status: Math.random() > 0.05 ? "running" : "stopped", // 5% chance of being stopped
        uptime: Math.floor(Math.random() * 30 * 24 * 60 * 60), // Up to 30 days in seconds
      },
      {
        name: "mysql",
        status: Math.random() > 0.05 ? "running" : "stopped",
        uptime: Math.floor(Math.random() * 15 * 24 * 60 * 60), // Up to 15 days in seconds
      },
      {
        name: "sshd",
        status: "running", // Always running
        uptime: Math.floor(Math.random() * 60 * 24 * 60 * 60), // Up to 60 days in seconds
      },
      {
        name: "firewalld",
        status: Math.random() > 0.02 ? "running" : "stopped", // 2% chance of being stopped
        uptime: Math.floor(Math.random() * 45 * 24 * 60 * 60), // Up to 45 days in seconds
      },
    ],
    uptime: Math.floor(Math.random() * 90 * 24 * 60 * 60), // Up to 90 days in seconds
    load: [
      0.5 + Math.random() * 1.5, // 1 min load
      0.7 + Math.random() * 1.3, // 5 min load
      0.6 + Math.random() * 1.0, // 15 min load
    ],
  };
}

// Generate server stats history (last 24 hours with 1-hour intervals)
export function generateServerStatsHistory(): ServerStats[] {
  const now = new Date();
  const history: ServerStats[] = [];

  for (let i = 0; i < 24; i++) {
    const statsTime = new Date(now);
    statsTime.setHours(now.getHours() - 23 + i);
    
    const stats = generateServerStats();
    stats.timestamp = statsTime.toISOString();
    
    history.push(stats);
  }

  return history;
}
