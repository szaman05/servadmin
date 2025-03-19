
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockUsers } from "@/lib/mock-data";
import { User, AuthContextType } from "@/types";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user on initial load
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    // Simulate API call with validation
    // In a real app, you'd make an API call to verify credentials
    const foundUser = mockUsers.find((u) => u.username === username);

    if (!foundUser) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      throw new Error("Invalid username or password");
    }

    // Simulate password verification (in a real app, you'd use bcrypt.compare)
    // This is just a simple simulation for the mockup
    if (foundUser.role === "admin" && password === "admin123" ||
        foundUser.role === "operator" && password === "operator123" ||
        foundUser.role === "viewer" && password === "viewer123") {
      
      // Update last login time
      const updatedUser = {
        ...foundUser,
        lastLogin: new Date().toISOString(),
      };
      
      // Store user in state and localStorage
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${updatedUser.username}!`,
      });
      
      // Redirect to dashboard
      navigate("/");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      throw new Error("Invalid username or password");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
