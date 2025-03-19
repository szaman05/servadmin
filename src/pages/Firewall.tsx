
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Save, RefreshCw, Shield, AlertTriangle, Search } from "lucide-react";
import { FirewallRule } from "@/types";
import { mockFirewallRules } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Firewall() {
  const [rules, setRules] = useState<FirewallRule[]>(mockFirewallRules);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFirewallActive, setIsFirewallActive] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const isReadOnly = user?.role === "viewer";

  const handleAddRule = () => {
    const newRule: FirewallRule = {
      id: Math.max(0, ...rules.map((r) => r.id)) + 1,
      sourceIp: "",
      port: 22,
      protocol: "tcp",
      description: "",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingRule(newRule);
  };

  const handleEditRule = (rule: FirewallRule) => {
    setEditingRule({ ...rule });
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    // Validate IP address
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
    if (!ipRegex.test(editingRule.sourceIp)) {
      toast({
        title: "Invalid IP Address",
        description: "Please enter a valid IPv4 address or CIDR notation (e.g., 192.168.1.1 or 10.0.0.0/24)",
        variant: "destructive",
      });
      return;
    }

    // Validate port number
    if (editingRule.port < 1 || editingRule.port > 65535) {
      toast({
        title: "Invalid Port",
        description: "Port must be between 1 and 65535",
        variant: "destructive",
      });
      return;
    }

    const updatedRule = {
      ...editingRule,
      updatedAt: new Date().toISOString(),
    };

    const existingRuleIndex = rules.findIndex((r) => r.id === updatedRule.id);

    if (existingRuleIndex >= 0) {
      // Update existing rule
      const newRules = [...rules];
      newRules[existingRuleIndex] = updatedRule;
      setRules(newRules);
      toast({
        title: "Rule Updated",
        description: `Firewall rule for ${updatedRule.sourceIp} has been updated.`,
      });
    } else {
      // Add new rule
      setRules([...rules, updatedRule]);
      toast({
        title: "Rule Added",
        description: `New firewall rule for ${updatedRule.sourceIp} has been added.`,
      });
    }

    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: number) => {
    setRules(rules.filter((rule) => rule.id !== ruleId));
    toast({
      title: "Rule Deleted",
      description: "The firewall rule has been deleted.",
    });
  };

  const handleToggleRule = (ruleId: number, enabled: boolean) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, enabled, updatedAt: new Date().toISOString() }
          : rule
      )
    );
    
    toast({
      title: enabled ? "Rule Enabled" : "Rule Disabled",
      description: `The firewall rule has been ${enabled ? "enabled" : "disabled"}.`,
    });
  };

  const handleToggleFirewall = (active: boolean) => {
    setIsFirewallActive(active);
    
    toast({
      title: active ? "Firewall Enabled" : "Firewall Disabled",
      description: `The firewall has been ${active ? "enabled" : "disabled"}.`,
      variant: active ? "default" : "destructive",
    });
  };

  const filteredRules = rules.filter(
    (rule) =>
      rule.sourceIp.includes(searchTerm) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Firewall Management</h2>
          <p className="text-muted-foreground">
            Configure and manage firewall rules for your CentOS 7 server
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <Switch
              id="firewall-status"
              checked={isFirewallActive}
              onCheckedChange={handleToggleFirewall}
              disabled={isReadOnly}
            />
            <Label htmlFor="firewall-status" className="font-medium">
              Firewall {isFirewallActive ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </div>
      </div>

      {!isFirewallActive && (
        <Card className="mb-6 border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div className="font-medium">
                Warning: Firewall is currently disabled. Your server may be vulnerable to unauthorized access.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="rules" className="mb-8">
        <TabsList>
          <TabsTrigger value="rules">Firewall Rules</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>IP-Based Rules</CardTitle>
                <CardDescription>
                  Manage access to your server based on source IP addresses
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search rules..."
                    className="pl-8 w-full sm:w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddRule}
                  className="flex items-center gap-1"
                  disabled={isReadOnly}
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No rules found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(enabled) =>
                              handleToggleRule(rule.id, enabled)
                            }
                            disabled={isReadOnly}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{rule.sourceIp}</TableCell>
                        <TableCell>{rule.port}</TableCell>
                        <TableCell>{rule.protocol.toUpperCase()}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {rule.description || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(rule.updatedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRule(rule)}
                              disabled={isReadOnly}
                            >
                              <Save className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={isReadOnly}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog
            open={!!editingRule}
            onOpenChange={(open) => {
              if (!open) setEditingRule(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRule && editingRule.id in rules
                    ? "Edit Firewall Rule"
                    : "Add Firewall Rule"}
                </DialogTitle>
                <DialogDescription>
                  Configure the firewall rule details below.
                </DialogDescription>
              </DialogHeader>
              {editingRule && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sourceIp" className="text-right">
                      Source IP
                    </Label>
                    <Input
                      id="sourceIp"
                      value={editingRule.sourceIp}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          sourceIp: e.target.value,
                        })
                      }
                      placeholder="192.168.1.0/24"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="port" className="text-right">
                      Port
                    </Label>
                    <Input
                      id="port"
                      type="number"
                      value={editingRule.port}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          port: parseInt(e.target.value),
                        })
                      }
                      min={1}
                      max={65535}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="protocol" className="text-right">
                      Protocol
                    </Label>
                    <Select
                      value={editingRule.protocol}
                      onValueChange={(value) =>
                        setEditingRule({
                          ...editingRule,
                          protocol: value as "tcp" | "udp" | "icmp",
                        })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="icmp">ICMP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={editingRule.description}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          description: e.target.value,
                        })
                      }
                      placeholder="Rule description"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="enabled" className="text-right">
                      Enabled
                    </Label>
                    <div className="col-span-3 flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={editingRule.enabled}
                        onCheckedChange={(checked) =>
                          setEditingRule({
                            ...editingRule,
                            enabled: checked,
                          })
                        }
                      />
                      <Label htmlFor="enabled">
                        {editingRule.enabled ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingRule(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRule}>
                  {editingRule && editingRule.id in rules ? "Update" : "Add"} Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Firewall Zones</CardTitle>
              <CardDescription>
                Manage firewall zones (available in a future update)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground/60 mb-4" />
                <p className="text-muted-foreground">
                  Firewall zones management will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Rules</CardTitle>
              <CardDescription>
                Manage access to services (available in a future update)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground/60 mb-4" />
                <p className="text-muted-foreground">
                  Service-based rules management will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
