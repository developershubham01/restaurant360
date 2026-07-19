import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import MenuManagement from './pages/MenuManagement';
import TableManagement from './pages/TableManagement';
import KitchenDisplay from './pages/KitchenDisplay';
import Inventory from './pages/Inventory';
import CRM from './pages/CRM';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AIChatbot from './pages/AIChatbot';
import SuperAdmin from './pages/SuperAdmin';
import SuperAdminLayout from './pages/SuperAdminLayout';
import { useAuthStore } from './store/authStore';
import api from './services/api';
import React from 'react';
import './App.css';

const pageMeta: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Welcome back, Rahul! Here\'s your restaurant overview.' },
  '/pos': { title: 'POS / Billing', subtitle: 'Process orders and manage billing.' },
  '/menu': { title: 'Menu Management', subtitle: 'Manage categories, items, and pricing.' },
  '/tables': { title: 'Table Management', subtitle: 'Floor layout, reservations & assignments.' },
  '/kitchen': { title: 'Kitchen Display (KDS)', subtitle: 'Real-time kitchen order tracking.' },
  '/inventory': { title: 'Inventory', subtitle: 'Track stock, suppliers, and purchases.' },
  '/crm': { title: 'Customers & CRM', subtitle: 'Customer profiles, loyalty & campaigns.' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Business insights and performance data.' },
  '/ai-chatbot': { title: 'AI Assistant', subtitle: 'Chat with your AI Restaurant Analyst.' },
  '/settings': { title: 'Settings', subtitle: 'Configure your restaurant.' },
  '/super-admin': { title: 'Super Admin Dashboard', subtitle: 'Manage corporate restaurant brands and branch outlets.' },
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const setFeatures = useAuthStore((state) => state.setFeatures);
  const outletId = useAuthStore((state) => state.outletId);
  const currentPage = pageMeta[location.pathname] || { title: 'Resto360' };

  React.useEffect(() => {
    if (isAuthenticated) {
      const loadFeatures = async () => {
        try {
          const res = await api.get('/api/features');
          if (res.data && res.data.success) {
            setFeatures(res.data.data);
          }
        } catch (err) {
          console.error('Failed to load active tenant features:', err);
        }
      };
      loadFeatures();
    }
  }, [isAuthenticated, outletId, setFeatures]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const roles = user.roles || [];
      if (roles.includes('KITCHEN') && location.pathname !== '/kitchen') {
        navigate('/kitchen');
      } else if (roles.includes('CASHIER') && !['/', '/pos', '/tables', '/crm'].includes(location.pathname)) {
        navigate('/pos');
      }
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const roles = user?.roles || [];
  const isSuperAdmin = roles.includes('ADMIN');

  if (isSuperAdmin) {
    return <SuperAdminLayout />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopBar title={currentPage.title} subtitle={currentPage.subtitle} />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/tables" element={<TableManagement />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-chatbot" element={<AIChatbot />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
