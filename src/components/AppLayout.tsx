import { ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Languages,
  Globe,
  Users,
  Code,
  Smartphone,
  LogOut,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const menuItems = [
  {
    title: 'דף הבית',
    icon: Home,
    path: '/localization',
    isHome: true,
  },
  {
    title: 'תרגומים',
    icon: Languages,
    path: '/localization',
  },
  {
    title: 'שפות',
    icon: Globe,
    path: '/languages',
  },
  {
    title: 'משתמשים',
    icon: Users,
    path: '/users',
  },
  {
    title: 'API',
    icon: Code,
    path: '/api',
  },
  {
    title: 'אפליקציות',
    icon: Smartphone,
    path: '/applications',
  },
];

export function AppLayout({ children, title, description }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-40 h-screen bg-background border-l transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b bg-primary text-primary-foreground flex items-center justify-between px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary-foreground/20">
                <Languages className="h-5 w-5" />
              </div>
              <span className="font-semibold">Comax</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Home Button */}
          <div className="px-3 mb-2">
            <Link to="/localization">
              <Button
                variant={location.pathname === '/localization' ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full gap-3",
                  sidebarOpen ? "justify-start" : "justify-center px-0"
                )}
              >
                <Home className="h-5 w-5" />
                {sidebarOpen && <span>דף הבית</span>}
              </Button>
            </Link>
          </div>

          <Separator className="my-2" />

          {/* Navigation Label */}
          {sidebarOpen && (
            <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
              ניווט
            </div>
          )}

          {/* Menu Items */}
          <div className="px-3 space-y-1">
            {menuItems.filter(item => !item.isHome).map((item) => (
              <Link key={item.path + item.title} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full gap-3",
                    sidebarOpen ? "justify-start" : "justify-center px-0"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {sidebarOpen && <span>{item.title}</span>}
                </Button>
              </Link>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t p-3">
          {sidebarOpen && user && (
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.displayName}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full gap-2",
              sidebarOpen ? "justify-start" : "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>יציאה</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          sidebarOpen ? "mr-64" : "mr-16"
        )}
      >
        {/* Top Header - Green */}
        <header className="sticky top-0 z-30 h-14 bg-primary text-primary-foreground shadow-sm flex items-center px-6">
          <div className="flex items-center gap-3">
            {title && (
              <>
                <h1 className="text-lg font-semibold">{title}</h1>
                {description && (
                  <>
                    <span className="text-primary-foreground/50">|</span>
                    <p className="text-sm text-primary-foreground/80">{description}</p>
                  </>
                )}
              </>
            )}
          </div>

          {/* User info on header */}
          <div className="mr-auto flex items-center gap-3">
            {user && (
              <span className="text-sm">
                שלום, {user.displayName}
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
