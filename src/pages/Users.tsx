
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, UserPlus, UserMinus, Search, UserCog, MoreHorizontal } from "lucide-react";
import { User as UserType } from "@/types";
import { mockUsers } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Users() {
  const [users, setUsers] = useState<UserType[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<(UserType & { confirmPassword?: string }) | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === "admin";

  const handleAddUser = () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can add new users.",
        variant: "destructive",
      });
      return;
    }

    const newUser = {
      id: Math.max(0, ...users.map((u) => u.id)) + 1,
      username: "",
      password: "",
      confirmPassword: "",
      role: "viewer" as const,
      email: "",
      lastLogin: new Date().toISOString(),
    };
    setEditingUser(newUser);
    setIsNewUser(true);
  };

  const handleEditUser = (user: UserType) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit users.",
        variant: "destructive",
      });
      return;
    }

    setEditingUser({ ...user, password: "", confirmPassword: "" });
    setIsNewUser(false);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    // Validate form
    if (!editingUser.username.trim()) {
      toast({
        title: "Validation Error",
        description: "Username is required.",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser.email.trim() || !editingUser.email.includes("@")) {
      toast({
        title: "Validation Error",
        description: "A valid email address is required.",
        variant: "destructive",
      });
      return;
    }

    if (isNewUser && !editingUser.password) {
      toast({
        title: "Validation Error",
        description: "Password is required for new users.",
        variant: "destructive",
      });
      return;
    }

    if (editingUser.password && editingUser.password !== editingUser.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate username
    const isDuplicateUsername = users.some(
      (u) => u.username === editingUser.username && u.id !== editingUser.id
    );

    if (isDuplicateUsername) {
      toast({
        title: "Validation Error",
        description: "Username already exists.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, we'd hash the password here

    const { confirmPassword, ...userToSave } = editingUser;

    if (isNewUser) {
      setUsers([...users, userToSave]);
      toast({
        title: "User Created",
        description: `User ${userToSave.username} has been created successfully.`,
      });
    } else {
      setUsers(
        users.map((u) => (u.id === userToSave.id ? userToSave : u))
      );
      toast({
        title: "User Updated",
        description: `User ${userToSave.username} has been updated successfully.`,
      });
    }

    setEditingUser(null);
    setIsNewUser(false);
  };

  const handleDeleteUser = (userId: number) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete users.",
        variant: "destructive",
      });
      return;
    }

    // Prevent deleting yourself
    if (userId === currentUser?.id) {
      toast({
        title: "Action Denied",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    setUsers(users.filter((u) => u.id !== userId));
    toast({
      title: "User Deleted",
      description: "The user has been deleted successfully.",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "operator":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "viewer":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage users and their access permissions
          </p>
        </div>
        <Button
          onClick={handleAddUser}
          className="flex items-center gap-1"
          disabled={!isAdmin}
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts and role-based access
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {user.username}
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(user.lastLogin).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                            disabled={!isAdmin}
                            className="flex items-center gap-2"
                          >
                            <UserCog className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={!isAdmin || user.id === currentUser?.id}
                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                          >
                            <UserMinus className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
            setIsNewUser(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNewUser ? "Add New User" : "Edit User"}
            </DialogTitle>
            <DialogDescription>
              {isNewUser
                ? "Create a new user account with appropriate permissions."
                : "Edit user details and permissions."}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editingUser.username}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      username: e.target.value,
                    })
                  }
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email: e.target.value,
                    })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({
                      ...editingUser,
                      role: value as "admin" | "operator" | "viewer",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Roles: </span>
                  Admin (full access), Operator (can modify but not add/delete), Viewer (read-only)
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {isNewUser ? "Password" : "New Password (leave blank to keep current)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={editingUser.password}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      password: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={editingUser.confirmPassword}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              {isNewUser ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
