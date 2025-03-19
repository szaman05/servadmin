
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Shield,
  Users,
  Settings,
  ServerCrash,
  Server,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface SidebarItemProps {
  icon: React.ElementType;
  title: string;
  to: string;
  end?: boolean;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, title, to, end = false, collapsed = false }: SidebarItemProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {!collapsed && <span>{title}</span>}
          </NavLink>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">{title}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

export function Sidebar({ open, setOpen }: SidebarProps) {
  const sidebarItems = [
    {
      title: "Dashboard",
      icon: BarChart3,
      to: "/",
      end: true,
    },
    {
      title: "Firewall",
      icon: Shield,
      to: "/firewall",
    },
    {
      title: "Users",
      icon: Users,
      to: "/users",
    },
    {
      title: "Server Control",
      icon: Server,
      to: "/server-control",
    },
    {
      title: "Settings",
      icon: Settings,
      to: "/settings",
    },
  ];

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <ServerCrash className="h-7 w-7 text-sidebar-primary" />
          {open && (
            <span className="ml-2 text-lg font-semibold text-sidebar-foreground">
              ServAdmin
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid gap-1 px-2 py-4">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              to={item.to}
              end={item.end}
              collapsed={!open}
            />
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground",
            !open && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {open && "Logout"}
        </Button>
      </div>
    </div>
  );
}
