import {
  Beaker,
  Activity,
  Brain,
  BarChart3,
  Search,
  History,
  ChevronLeft,
  ChevronRight,
  Atom,
  Cloud,
  Bot
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  {
    title: "Experiment Control",
    url: "/",
    icon: Beaker,
    description: "Configure & run experiments"
  },
  {
    title: "Internal Signals",
    url: "/signals",
    icon: Activity,
    description: "Monitor training dynamics"
  },
  {
    title: "Self-Awareness",
    url: "/awareness",
    icon: Brain,
    description: "Failure prediction"
  },
  {
    title: "AI Assistant",
    url: "/assistant",
    icon: Bot,
    description: "Expert Guidance"
  },
  {
    title: "Production Monitoring",
    url: "/production",
    icon: Cloud,
    description: "Live inference telemetry"
  },
  {
    title: "Metrics & Evaluation",
    url: "/metrics",
    icon: BarChart3,
    description: "ISS / PSU analysis"
  },
  {
    title: "Explainability",
    url: "/explainability",
    icon: Search,
    description: "Signal attribution"
  },
  {
    title: "Experiment History",
    url: "/history",
    icon: History,
    description: "Past experiments"
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Atom className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">AegisML</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              )} />
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              Research Dashboard v0.1
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Internal Behavioral Introspection
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
