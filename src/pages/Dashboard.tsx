
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertCircle, HardDrive, RefreshCcw, Server, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { generateServerStats, generateServerStatsHistory } from "@/lib/mock-data";
import { ServerStats } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [statsHistory, setStatsHistory] = useState<ServerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertServices, setAlertServices] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch server stats (simulated)
  const fetchServerStats = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newStats = generateServerStats();
      setStats(newStats);
      
      // Check for services that are stopped
      const stoppedServices = newStats.services
        .filter(service => service.status === "stopped")
        .map(service => service.name);
      
      setAlertServices(stoppedServices);
      
      // Show alerts for stopped services
      stoppedServices.forEach(service => {
        toast({
          title: `Service Alert: ${service}`,
          description: `The ${service} service is currently stopped.`,
          variant: "destructive",
        });
      });
      
      setLoading(false);
    }, 800);
  };

  const fetchStatsHistory = () => {
    // Simulate API call
    setTimeout(() => {
      const history = generateServerStatsHistory();
      setStatsHistory(history);
    }, 1000);
  };

  // Initial data load
  useEffect(() => {
    fetchServerStats();
    fetchStatsHistory();
    
    // Set up polling every 30 seconds (in a real app)
    const interval = setInterval(fetchServerStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchServerStats();
    fetchStatsHistory();
    
    toast({
      title: "Refreshed",
      description: "Server statistics have been updated.",
    });
  };

  // Prepare chart data
  const cpuData = statsHistory.map(stat => ({
    time: new Date(stat.timestamp).toLocaleTimeString(),
    usage: stat.cpu.usage,
  }));

  const memoryData = statsHistory.map(stat => ({
    time: new Date(stat.timestamp).toLocaleTimeString(),
    used: Math.round(stat.memory.used / 1024), // Convert to GB
    cache: Math.round(stat.memory.cache / 1024), // Convert to GB
  }));

  const diskData = statsHistory.map(stat => ({
    time: new Date(stat.timestamp).toLocaleTimeString(),
    read: stat.disk.read,
    write: stat.disk.write,
  }));

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Server Dashboard</h2>
        <Button
          onClick={handleRefresh}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {alertServices.length > 0 && (
        <Card className="bg-destructive/10 border-destructive mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">
                  Service Alerts Detected
                </h3>
                <p className="text-sm text-muted-foreground">
                  The following services are currently stopped:{" "}
                  <span className="font-medium text-destructive">
                    {alertServices.join(", ")}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.cpu.usage || 0}%
            </div>
            <Progress 
              value={stats?.cpu.usage || 0} 
              className="h-2 mt-2"
              // Green below 50%, yellow between 50-80%, red above 80%
              color={
                (stats?.cpu.usage || 0) < 50
                  ? "bg-green-500"
                  : (stats?.cpu.usage || 0) < 80
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.cpu.cores || 4} CPU Cores | Temp: {stats?.cpu.temperature || 0}°C
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Math.round((stats.memory.used / stats.memory.total) * 100) : 0}%
            </div>
            <Progress 
              value={stats ? (stats.memory.used / stats.memory.total) * 100 : 0} 
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stats ? formatBytes(stats.memory.used * 1024 * 1024) : '0 GB'} / {stats ? formatBytes(stats.memory.total * 1024 * 1024) : '0 GB'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Math.round((stats.disk.used / stats.disk.total) * 100) : 0}%
            </div>
            <Progress 
              value={stats ? (stats.disk.used / stats.disk.total) * 100 : 0} 
              className="h-2 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stats ? formatBytes(stats.disk.used * 1024 * 1024) : '0 GB'} / {stats ? formatBytes(stats.disk.total * 1024 * 1024) : '0 GB'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatUptime(stats.uptime) : '0d 0h 0m'}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <div>Load Avg:</div>
              <div className="font-medium">
                {stats ? stats.load.map(l => l.toFixed(2)).join(' | ') : '0.00 | 0.00 | 0.00'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>System Services</CardTitle>
            <CardDescription>
              Current status of critical system services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.services.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`h-3 w-3 rounded-full ${
                        service.status === "running" 
                          ? "bg-green-500" 
                          : service.status === "restarting" 
                          ? "bg-yellow-500" 
                          : "bg-destructive"
                      }`} 
                    />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm ${
                      service.status === "running" 
                        ? "text-green-500" 
                        : service.status === "restarting" 
                        ? "text-yellow-500" 
                        : "text-destructive"
                    }`}>
                      {service.status}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatUptime(service.uptime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Interfaces</CardTitle>
            <CardDescription>
              Network traffic and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats?.network.interfaces.map((iface) => (
                <div key={iface.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{iface.name}</div>
                    <div className="text-sm text-muted-foreground">{iface.ipAddress}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">RX</span>
                      <span className="font-medium">{iface.rx} MB/s</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">TX</span>
                      <span className="font-medium">{iface.tx} MB/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance History</CardTitle>
          <CardDescription>
            System performance metrics over the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cpu">
            <TabsList className="mb-4">
              <TabsTrigger value="cpu">CPU</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="disk">Disk I/O</TabsTrigger>
            </TabsList>
            <TabsContent value="cpu" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Area type="monotone" dataKey="usage" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="memory" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis unit="GB" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="used" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Used Memory" />
                  <Area type="monotone" dataKey="cache" stackId="1" stroke="#a3bffa" fill="#a3bffa" fillOpacity={0.2} name="Cached Memory" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="disk" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis unit="MB/s" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="read" fill="#3b82f6" name="Disk Read" />
                  <Bar dataKey="write" fill="#a3bffa" name="Disk Write" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
