import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LayoutDashboard, Users, BarChart3, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Utenti", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato con successo");
    navigate("/admin-login");
  };

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <button
            key={item.name}
            onClick={() => {
              navigate(item.href);
              setMobileMenuOpen(false);
            }}
            className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
              isActive
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 scale-105"
                : "text-foreground hover:bg-secondary/80 hover:scale-102"
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
            <span>{item.name}</span>
          </button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-gradient-to-b from-secondary/30 to-secondary/80 backdrop-blur-xl border-r border-primary/10 shadow-xl">
        <div className="flex flex-col flex-1 p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-primary/10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-[#b55819] to-accent flex items-center justify-center shadow-lg ring-4 ring-white/20">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Alma Admin</h1>
              <p className="text-xs text-muted-foreground font-medium">Dashboard Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Navigazione</p>
            <NavLinks />
          </nav>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full mt-6 gap-2 border-2 border-red-500/50 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all hover:scale-105 font-semibold rounded-xl py-6"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white to-secondary/50 backdrop-blur-xl border-b border-primary/10 px-4 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-[#b55819] to-accent flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Alma Admin</span>
        </div>
        
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col h-full py-6">
              <div className="mb-8">
                <h2 className="text-lg font-bold text-primary">Menu</h2>
              </div>
              <nav className="flex-1 space-y-2">
                <NavLinks />
              </nav>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 pt-20 lg:pt-0 bg-gradient-to-br from-background via-secondary/5 to-background min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
