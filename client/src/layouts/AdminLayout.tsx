import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  QrCode, 
  BarChart3, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ShoppingBag, label: 'Live Orders', path: '/admin/live-orders' },
    { icon: UtensilsCrossed, label: 'Menu Management', path: '/admin/menu' },
    { icon: QrCode, label: 'Table & QR', path: '/admin/tables' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Shop Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform 
        dark:bg-dark-card bg-white border-r dark:border-dark-border border-light-border
        transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-gold">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display dark:text-brand-500 text-brand-700 leading-tight">RestroMate</h1>
              <p className="text-[10px] uppercase tracking-widest dark:text-brand-700 text-brand-600 font-bold">Admin Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t dark:border-dark-border border-light-border">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate dark:text-brand-500 text-brand-700">{user?.name}</p>
                <p className="text-[10px] dark:text-brand-700 text-brand-600 uppercase font-bold tracking-wider">{user?.role}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full sidebar-item text-red-500 dark:hover:bg-red-500/10 hover:bg-red-50 group"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 dark:bg-dark-bg bg-light-bg border-b dark:border-dark-border border-light-border sticky top-0 z-40">
          <button 
            className="md:hidden p-2 dark:text-brand-600 text-brand-600"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-1 md:flex-none">
            <h2 className="text-lg font-bold md:hidden text-gold font-display">RestroMate</h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl dark:bg-dark-muted bg-light-muted dark:text-brand-500 text-brand-700 transition-all hover:scale-110 shadow-sm"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl dark:bg-dark-muted bg-light-muted border dark:border-dark-border border-light-border">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-semibold dark:text-brand-500 text-brand-700">Server Live</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto dark:bg-dark-bg bg-light-bg p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
