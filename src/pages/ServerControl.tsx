
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Power, RefreshCw, AlertTriangle, Terminal, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ScheduledTask {
  id: number;
  name: string;
  schedule: string;
  command: string;
  lastRun: string | null;
  nextRun: string;
  status: "active" | "disabled";
}

// Mock scheduled tasks
const mockTasks: ScheduledTask[] = [
  {
    id: 1,
    name: "Backup Database",
    schedule: "0 2 * * *",
    command: "mysqldump -u root -p mydb > /backups/mydb_$(date +%Y%m%d).sql",
    lastRun: "2023-09-10T02:00:00Z",
    nextRun: "2023-09-11T02:00:00Z",
    status: "active",
  },
  {
    id: 2,
    name: "Clean Temp Files",
    schedule: "0 3 * * 0",
    command: "find /tmp -type f -atime +7 -delete",
    lastRun: "2023-09-03T03:00:00Z",
    nextRun: "2023-09-10T03:00:00Z",
    status: "active",
  },
  {
    id: 3,
    name: "Update System",
    schedule: "0 4 * * 1",
    command: "yum -y update",
    lastRun: "2023-09-04T04:00:00Z",
    nextRun: "2023-09-11T04:00:00Z",
    status: "disabled",
  },
];

export default function ServerControl() {
  const [isRestarting, setIsRestarting] = useState(false);
  const [tasks, setTasks] = useState<ScheduledTask[]>(mockTasks);
  const [commandOutput, setCommandOutput] = useState("");
  const [commandInput, setCommandInput] = useState("");
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isReadOnly = user?.role === "viewer";
  const canRestart = user?.role === "admin" || user?.role === "operator";

  const handleServerRestart = () => {
    if (!canRestart) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to restart the server.",
        variant: "destructive",
      });
      return;
    }

    setIsRestarting(true);
    
    // Simulate server restart
    toast({
      title: "Server Restarting",
      description: "The server shutdown sequence has been initiated.",
    });
    
    // Simulate a restart process
    setTimeout(() => {
      setIsRestarting(false);
      toast({
        title: "Server Restarted",
        description: "The server has been successfully restarted.",
      });
    }, 5000);
  };

  const handleCommandExecution = () => {
    if (!commandInput.trim()) return;
    
    setIsRunningCommand(true);
    setCommandOutput("");
    
    // Simulate command execution
    setTimeout(() => {
      // Simulate command output based on input
      let output = "";
      
      if (commandInput.includes("ls")) {
        output = "bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var";
      } else if (commandInput.includes("uptime")) {
        output = " 15:42:43 up 21 days, 4:42, 1 user, load average: 0.23, 0.34, 0.28";
      } else if (commandInput.includes("df")) {
        output = "Filesystem     1K-blocks    Used Available Use% Mounted on\n" +
                "devtmpfs         4096000       0   4096000   0% /dev\n" +
                "tmpfs            4106788       0   4106788   0% /dev/shm\n" +
                "tmpfs            4106788    9496   4097292   1% /run\n" +
                "tmpfs            4106788       0   4106788   0% /sys/fs/cgroup\n" +
                "/dev/sda1      104857600 20240896  84616704  20% /\n" +
                "tmpfs             821356      76    821280   1% /run/user/1000";
      } else if (commandInput.includes("who") || commandInput.includes("whoami")) {
        output = "root";
      } else if (commandInput.includes("ps")) {
        output = "  PID TTY          TIME CMD\n" +
                "    1 ?        00:00:09 systemd\n" +
                "    2 ?        00:00:00 kthreadd\n" +
                "    3 ?        00:00:00 rcu_gp\n" +
                "    4 ?        00:00:00 rcu_par_gp\n" +
                "  950 ?        00:00:24 httpd\n" +
                "  951 ?        00:01:14 mysqld\n" +
                " 1050 ?        00:00:18 sshd";
      } else if (commandInput.includes("service")) {
        output = "Redirecting to /bin/systemctl status " + commandInput.split(" ")[1] + "\n" +
                "● httpd.service - The Apache HTTP Server\n" +
                "   Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; vendor preset: disabled)\n" +
                "   Active: active (running) since Mon 2023-09-01 11:23:56 UTC; 21 days ago\n" +
                " Main PID: 950 (httpd)\n" +
                "   Status: \"Total requests: 1284; Current requests/sec: 0; Current traffic:   0 B/sec\"\n" +
                "    Tasks: 6 (limit: 5905)\n" +
                "   Memory: 32.7M\n" +
                "   CGroup: /system.slice/httpd.service\n" +
                "           ├─950 /usr/sbin/httpd -DFOREGROUND\n" +
                "           ├─951 /usr/sbin/httpd -DFOREGROUND\n" +
                "           ├─952 /usr/sbin/httpd -DFOREGROUND\n" +
                "           ├─953 /usr/sbin/httpd -DFOREGROUND\n" +
                "           └─954 /usr/sbin/httpd -DFOREGROUND";
      } else {
        output = "Command not found or not allowed in demo: " + commandInput;
      }
      
      setCommandOutput(output);
      setIsRunningCommand(false);
      
      toast({
        title: "Command Executed",
        description: `Executed: ${commandInput}`,
      });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Server Control</h2>
          <p className="text-muted-foreground">
            Manage server operations and scheduled tasks
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Server Power Management</CardTitle>
            <CardDescription>
              Control server power state and perform restarts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Power className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">System Status: Online</h3>
                <p className="text-sm text-muted-foreground">
                  The server is currently running normally
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2 px-8"
                  disabled={isRestarting || !canRestart}
                >
                  <RefreshCw className="h-4 w-4" />
                  {isRestarting ? "Restarting..." : "Restart Server"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will restart the server. All active connections will be dropped and services will be temporarily unavailable.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleServerRestart}
                  >
                    Yes, Restart Server
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current server information and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Hostname</span>
                  <span className="font-medium">centos7-server</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Kernel</span>
                  <span className="font-medium">3.10.0-1160.83.1.el7.x86_64</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">OS</span>
                  <span className="font-medium">CentOS Linux 7 (Core)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Architecture</span>
                  <span className="font-medium">x86_64</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">CPU</span>
                  <span className="font-medium">Intel Xeon E5-2680 (4 vCPUs)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Memory</span>
                  <span className="font-medium">16 GB</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">IP Address</span>
                  <span className="font-medium">192.168.1.10 (eth0)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Last Boot</span>
                  <span className="font-medium">21 days ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="mb-6">
        <TabsList>
          <TabsTrigger value="tasks">Scheduled Tasks</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
              <CardDescription>
                Manage scheduled tasks and cron jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Schedule (cron)</TableHead>
                    <TableHead className="hidden md:table-cell">Command</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-1 py-0.5 rounded text-sm">{task.schedule}</code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="bg-muted px-1 py-0.5 rounded text-sm truncate max-w-[200px] block">
                          {task.command}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          task.status === "active" ? "text-green-600" : "text-muted-foreground"
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${
                            task.status === "active" ? "bg-green-600" : "bg-muted-foreground"
                          }`} />
                          {task.status === "active" ? "Active" : "Disabled"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {task.lastRun ? new Date(task.lastRun).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell>{new Date(task.nextRun).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={isReadOnly}
              >
                <Clock className="h-4 w-4" />
                Add Task
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="terminal">
          <Card>
            <CardHeader>
              <CardTitle>Terminal Access</CardTitle>
              <CardDescription>
                Execute commands remotely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-black rounded-md p-4 text-white font-mono text-sm h-64 overflow-y-auto">
                  <div className="mb-4">
                    {commandOutput ? (
                      <pre className="whitespace-pre-wrap">{commandOutput}</pre>
                    ) : (
                      <div className="text-gray-500">
                        # Command output will appear here
                      </div>
                    )}
                  </div>
                  {isRunningCommand && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="animate-spin h-4 w-4">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <span>Executing command...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="command">Command</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="command"
                      placeholder="Enter command (e.g., ls -la, uptime, df -h)"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isReadOnly && !isRunningCommand) {
                          handleCommandExecution();
                        }
                      }}
                      disabled={isReadOnly || isRunningCommand}
                      className="font-mono"
                    />
                    <Button
                      onClick={handleCommandExecution}
                      disabled={isReadOnly || isRunningCommand || !commandInput.trim()}
                    >
                      {isRunningCommand ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        "Execute"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Only use commands you understand. Destructive commands are disabled in this demo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
