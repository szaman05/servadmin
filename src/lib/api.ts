
import { User, FirewallRule, ServerStats, ServerLog, LoginResponse, AllowMyIpResponse, ServiceControlResponse } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;
  
  constructor() {
    // Check if token exists in localStorage
    this.token = localStorage.getItem('token');
  }
  
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }
  
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const config = {
      ...options,
      headers
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Auth
  async login(username: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }
  
  // Firewall
  async getFirewallRules(): Promise<FirewallRule[]> {
    return this.request<FirewallRule[]>('/firewall/rules');
  }
  
  async addFirewallRule(rule: Omit<FirewallRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirewallRule> {
    return this.request<FirewallRule>('/firewall/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
  }
  
  async updateFirewallRule(id: number, rule: Partial<FirewallRule>): Promise<FirewallRule> {
    return this.request<FirewallRule>(`/firewall/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule)
    });
  }
  
  async deleteFirewallRule(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/firewall/rules/${id}`, {
      method: 'DELETE'
    });
  }
  
  async allowMyIp(description: string): Promise<AllowMyIpResponse> {
    return this.request<AllowMyIpResponse>('/firewall/allow-my-ip', {
      method: 'POST',
      body: JSON.stringify({ description })
    });
  }
  
  // Server Stats
  async getServerStats(): Promise<ServerStats> {
    return this.request<ServerStats>('/servers/stats');
  }
  
  // Server Control
  async controlService(action: 'start' | 'stop' | 'restart' | 'status', service: string): Promise<ServiceControlResponse> {
    return this.request<ServiceControlResponse>(`/server/control/${action}`, {
      method: 'POST',
      body: JSON.stringify({ service })
    });
  }
  
  // Users (Admin)
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }
  
  async addUser(user: { username: string, password: string, role: string, email: string }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }
  
  // Logs
  async getLogs(): Promise<ServerLog[]> {
    return this.request<ServerLog[]>('/logs');
  }
}

export const api = new ApiService();
