import * as React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileBarChart, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  const [location] = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileBarChart,
    },
    {
      name: "Traceability Matrix",
      href: "/traceability-matrix",
      icon: ListFilter,
    },
  ];

  return (
    <div className="flex items-center justify-between px-2 border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
      <div className="flex items-center gap-6">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl md:text-3xl">{heading}</h1>
          {text && <p className="text-muted-foreground">{text}</p>}
        </div>
        
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
