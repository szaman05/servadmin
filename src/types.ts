
// User type with role-based access control
export interface User {
  id: number;
  username: string;
  password: string; // In a real app, this would be a hash
  role: "admin" | "operator" | "viewer";
  email: string;
  lastLogin: string;
}

// Firewall rule
export interface FirewallRule {
  id: number;
  sourceIp: string;
  port: number;
  protocol: "tcp" | "udp" | "icmp";
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Server statistics
export interface ServerStats {
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    cache: number;
  };
  disk: {
    total: number;
    used: number;
    read: number;
    write: number;
  };
  network: {
    interfaces: {
      name: string;
      ipAddress: string;
      rx: number;
      tx: number;
    }[];
  };
  services: {
    name: string;
    status: "running" | "stopped" | "restarting";
    uptime: number;
  }[];
  uptime: number;
  load: number[];
}

// Auth context
export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
