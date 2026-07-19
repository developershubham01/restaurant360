import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Grid3X3,
  ChefHat,
  Package,
  Users,
  BarChart3,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Utensils,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Sidebar.css';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview Dashboard' },
  { path: '/pos', icon: ShoppingCart, label: 'Billing Counter (POS)' },
  { path: '/menu', icon: UtensilsCrossed, label: 'Menu & Dishes' },
  { path: '/tables', icon: Grid3X3, label: 'Table Layout' },
  { path: '/kitchen', icon: ChefHat, label: 'Kitchen Orders (KDS)' },
  { path: '/inventory', icon: Package, label: 'Stock & Inventory' },
  { path: '/crm', icon: Users, label: 'Loyalty & Customers' },
  { path: '/reports', icon: BarChart3, label: 'Analytics & Reports' },
  { path: '/ai-chatbot', icon: Sparkles, label: 'AI Analyst Chatbot' },
  { path: '/settings', icon: Settings, label: 'System Settings' },
  { path: '/super-admin', icon: Shield, label: 'Super Admin ERP' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const roles = user?.roles || [];
  const features = useAuthStore((state) => state.features);

  const filteredMenuItems = menuItems.filter((item) => {
    // Hide Super Admin page from everyone except ADMIN
    if (item.path === '/super-admin') {
      return roles.includes('ADMIN');
    }

    // Dynamic modular feature toggling checks
    if (item.path === '/pos' && features['POS'] === false) return false;
    if (item.path === '/kitchen' && features['KITCHEN_DISPLAY'] === false) return false;
    if (item.path === '/inventory' && features['INVENTORY'] === false) return false;
    if (item.path === '/crm' && features['CRM'] === false) return false;
    if (item.path === '/reports' && features['REPORTS'] === false) return false;
    if (item.path === '/ai-chatbot' && features['AI_REPORTS'] === false) return false;

    if (roles.includes('ADMIN') || roles.includes('OWNER')) {
      return true;
    }
    if (roles.includes('KITCHEN')) {
      return item.path === '/kitchen';
    }
    if (roles.includes('CASHIER')) {
      return ['/', '/pos', '/tables', '/crm'].includes(item.path);
    }
    return true;
  });

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Utensils size={22} />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="logo-restaurant">Resto</span>
            <span className="logo-360">360</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="sidebar-nav-icon">
                <Icon size={20} />
              </div>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
              {isActive && <div className="sidebar-active-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="sidebar-nav-item sidebar-logout"
          title={collapsed ? 'Logout' : undefined}
          onClick={logout}
        >
          <div className="sidebar-nav-icon">
            <LogOut size={20} />
          </div>
          {!collapsed && <span className="sidebar-nav-label">Logout</span>}
        </button>

        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
