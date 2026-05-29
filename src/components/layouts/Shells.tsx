import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Code2, Briefcase, User, LogOut, ShieldCheck, Award, MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const learnerNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tracks", label: "Learning tracks", icon: BookOpen },
  { to: "/playground", label: "SQL playground", icon: Code2 },
  { to: "/projects", label: "Projects", icon: Briefcase },
  { to: "/interview", label: "Interview prep", icon: MessageSquare },
  { to: "/mock-interview", label: "Mock interview", icon: Mic },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell() {
  const { signOut, user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex bg-gradient-subtle">
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-display font-bold">AV</div>
            <span className="font-display font-semibold text-sidebar-foreground">Vanguard</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {learnerNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-6 border border-sidebar-border",
                isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 mb-2 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden h-14 border-b bg-background flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2"><div className="h-7 w-7 rounded bg-primary text-primary-foreground grid place-items-center font-bold text-sm">AV</div><span className="font-display font-semibold">Vanguard</span></Link>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
        <div className="lg:hidden border-b bg-background overflow-x-auto">
          <div className="flex">
            {learnerNav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2", isActive ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground")}>
                <item.icon className="h-4 w-4" /> {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => cn("flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2", isActive ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground")}>
                <ShieldCheck className="h-4 w-4" /> Admin
              </NavLink>
            )}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

const adminNav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/learners", label: "Learners", icon: User },
  { to: "/admin/curriculum", label: "Curriculum", icon: BookOpen },
  { to: "/admin/datasets", label: "Datasets", icon: Code2 },
  { to: "/admin/submissions", label: "Submissions", icon: Briefcase },
  { to: "/admin/interview", label: "Interview bank", icon: MessageSquare },
  { to: "/admin/mock-interviews", label: "Mock reviews", icon: Mic },
  { to: "/admin/certificates", label: "Certificates", icon: Award },
];

export function AdminShell() {
  const { signOut, user } = useAuth();
  return (
    <div className="min-h-screen flex bg-gradient-subtle">
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-accent text-accent-foreground grid place-items-center font-display font-bold">AV</div>
            <div>
              <div className="font-display font-semibold leading-tight">Vanguard</div>
              <div className="text-[10px] uppercase tracking-wider text-accent">Admin</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50")}>
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
          <NavLink to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 mt-6 border border-sidebar-border">
            <LayoutDashboard className="h-4 w-4" /> Learner view
          </NavLink>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 mb-2 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="lg:hidden h-14 border-b bg-background flex items-center justify-between px-4">
          <span className="font-display font-semibold">Admin</span>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
        <div className="lg:hidden border-b bg-background overflow-x-auto">
          <div className="flex">
            {adminNav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2", isActive ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground")}>
                <item.icon className="h-4 w-4" /> {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
