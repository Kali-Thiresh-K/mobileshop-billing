import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Smartphone,
  TrendingUp,
  Truck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ShoppingCart, label: "POS / Billing", path: "/pos" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: FileText, label: "Invoices", path: "/invoices" },
  { icon: TrendingUp, label: "EMI Plans", path: "/emi" },
  { icon: Truck, label: "Suppliers", path: "/suppliers" },
  { icon: RotateCcw, label: "Returns", path: "/returns" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppLayout({ children }: AppLayoutProps) {
  // Mobile: default closed (false), Desktop: default open (true)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Optional: Add event listener to handle resize dynamically
    // window.addEventListener('resize', handleResize);
    // return () => window.removeEventListener('resize', handleResize);

    // Actually, distinct states might be better, but for now simple check on mount
  }, []);
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 border-b bg-background/80 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg gradient-text">Mobile Shop</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col glass-card border-r transition-all duration-300 bg-background",
          // Mobile: Slide in/out
          "transform md:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Width control
          "w-64",
          // Desktop collapsed state (controlled by a separate state or prop if we want desktop collapse)
          // For now, let's keep desktop sidebar always open/wide for simplicity based on "same in computer screen"
          // If desktop needs collapse, we'd need a separate 'desktopSidebarOpen' state. 
          // Assuming user wants "same in computer screen" means the wide sidebar. 
          // But the original code had toggle logic. Let's preserve desktop toggle capability if possible, 
          // but for mobile 'sidebarOpen' means "is menu visible".
          // Let's separate mobile and desktop states if we want true fidelity, but the prompt says "responsive in mobile".
          // Simplified approach: on mobile 'sidebarOpen' toggles visibility. On desktop, let's stick to the 
          // prompt "same in computer screen" which arguably implies the existing behavior or a fixed sidebar.
          // The previous code used one state 'sidebarOpen' for width on desktop.
          // Let's refine: 
          // Mobile: sidebarOpen = visible (drawer).
          // Desktop: sidebarOpen = expanded width (vs collapsed icon-only).
          // To do this cleanly, we might need a media query check or just use the class logic carefully.
          // BUT, typical mobile pattern is "closed by default". Desktop is "open by default".
          // Let's rely on the classes.
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50 h-16">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <span className={cn("font-semibold text-lg gradient-text transition-all duration-300 pointer-events-none",
            !sidebarOpen && "md:opacity-0 md:hidden" // Hide text when collapsed on desktop?
            // Actually, the previous code used sidebarOpen to toggle width 64 vs 20.
            // On mobile, we want w-64 always when open.
          )}>
            Mobile Shop
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:flex hidden" // Only show toggle on desktop
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  // Close sidebar on mobile when item clicked
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn("font-medium transition-all duration-300",
                  !sidebarOpen && "md:hidden" // Hide label on desktop collapsed
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3", !sidebarOpen && "md:justify-center")}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className={cn("transition-all duration-300", !sidebarOpen && "md:hidden")}>
              Logout
            </span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-16 md:pt-0", // Add padding top for mobile header
          sidebarOpen ? "md:ml-64" : "md:ml-20" // Margin left only on desktop
        )}
      >
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}