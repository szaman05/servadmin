
// User type with role-based access control
export interface User {
  id: number;
  username: string;
  password?: string; // Only used for login, not stored in state
  role: "admin" | "operator" | "viewer";
  email: string;
  lastLogin: string;
}

// Firewall rule
export interface FirewallRule {
  id: number;
  sourceIp: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  createdByUsername?: string;
}

// Temporary IP access (for "Allow My IP" feature)
export interface TemporaryIpAccess {
  id: number;
  userId: number;
  ipAddress: string;
  description: string;
  expiresAt: string;
  createdAt: string;
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

// Server logs
export interface ServerLog {
  id: number;
  serverId: number;
  logType: "info" | "warning" | "error" | "critical";
  message: string;
  createdAt: string;
}

// Auth context
export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AllowMyIpResponse {
  id: number;
  ip_address: string;
  description: string;
  expires_at: string;
  message: string;
}

export interface ServiceControlResponse {
  action: string;
  service: string;
  stdout: string;
  stderr: string;
  timestamp: string;
}
