import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  ChevronDown,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Maximize,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import './TopBar.css';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { outletId, setOutletId, user, logout, isImpersonating, exitImpersonation } = useAuthStore((state) => state);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isOnline] = useState(true);
  
  const [outlets, setOutlets] = useState<any[]>([]);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  const handleOpenProfile = async () => {
    try {
      const res = await api.get('/api/auth/profile');
      if (res.data && res.data.success) {
        const u = res.data.data;
        setProfileForm({
          fullName: u.fullName || '',
          email: u.email || '',
          phone: u.phone || '',
          password: ''
        });
        setShowProfileModal(true);
        setProfileOpen(false);
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('fullName', profileForm.fullName);
      params.append('email', profileForm.email);
      if (profileForm.phone) {
        params.append('phone', profileForm.phone);
      }
      if (profileForm.password) {
        params.append('password', profileForm.password);
      }

      const res = await api.put(`/api/auth/profile?${params.toString()}`);
      if (res.data && res.data.success) {
        alert('Profile details updated successfully!');
        setShowProfileModal(false);
        const storeUser = useAuthStore.getState().user;
        if (storeUser) {
          useAuthStore.setState({
            user: {
              ...storeUser,
              fullName: res.data.data.fullName,
              email: res.data.data.email,
              phone: res.data.data.phone
            }
          });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Profile update failed.');
    }
  };

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const res = await api.get('/api/outlets');
        if (res.data && res.data.success) {
          setOutlets(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load outlets:', err);
      }
    };
    fetchOutlets();
  }, []);

  const activeOutlet = outlets.find((o) => o.id === outletId) || { name: 'Main Branch' };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const notifications = [
    { id: 1, text: 'New order #1042 received', time: '2 min ago', unread: true },
    { id: 2, text: 'Low stock alert: Paneer', time: '15 min ago', unread: true },
    { id: 3, text: 'Table 5 bill settled — ₹1,250', time: '30 min ago', unread: false },
    { id: 4, text: 'New customer registered', time: '1 hr ago', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title-section">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>

      {isImpersonating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ff6b00', padding: '6px 16px', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: 600, boxShadow: '0 0 10px rgba(255,107,0,0.5)' }}>
          <span>Masquerading: {user?.username}</span>
          <button
            onClick={() => {
              exitImpersonation();
              window.location.href = '/';
            }}
            style={{ background: '#fff', color: '#ff6b00', border: 'none', borderRadius: '12px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            EXIT SESSION
          </button>
        </div>
      )}

      <div className="topbar-right">
        {/* Search */}
        <div className={`topbar-search ${searchOpen ? 'open' : ''}`}>
          {searchOpen && (
            <input
              type="text"
              placeholder="Search orders, items, customers..."
              autoFocus
              onBlur={() => setSearchOpen(false)}
            />
          )}
          <button
            className="topbar-icon-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            title="Search"
          >
            <Search size={19} />
          </button>
        </div>

        {/* Online Status */}
        <div className={`topbar-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Branch Selector */}
        <div className="topbar-branch-wrapper" style={{ position: 'relative' }}>
          <button 
            className="topbar-branch-btn" 
            onClick={() => {
              const isAdmin = user?.roles?.some((r: string) => r === 'ADMIN');
              if (isAdmin) {
                setBranchDropdownOpen(!branchDropdownOpen);
              }
            }}
            style={{ 
              cursor: user?.roles?.some((r: string) => r === 'ADMIN') ? 'pointer' : 'default' 
            }}
          >
            <Store size={16} />
            <span>{activeOutlet.name}</span>
            {user?.roles?.some((r: string) => r === 'ADMIN') && <ChevronDown size={14} />}
          </button>

          {branchDropdownOpen && (
            <div className="topbar-dropdown branch-dropdown" style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 100, minWidth: '180px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              {outlets.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setOutletId(o.id);
                    setBranchDropdownOpen(false);
                    // Force HMR / reload of active dynamic pages
                    window.dispatchEvent(new Event('outletChanged'));
                  }}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    background: o.id === outletId ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: o.id === outletId ? 'var(--primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: o.id === outletId ? 600 : 400,
                  }}
                  className="branch-dropdown-item"
                >
                  {o.name}
                </button>
              ))}
              {outlets.length === 0 && (
                <span style={{ padding: '10px 14px', color: 'var(--text-tertiary)', fontSize: '12px' }}>No branches loaded</span>
              )}
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          className="topbar-icon-btn"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Fullscreen */}
        <button
          className="topbar-icon-btn"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          title="Fullscreen"
        >
          <Maximize size={18} />
        </button>

        {/* Notifications */}
        <div className="topbar-notif-wrapper">
          <button
            className="topbar-icon-btn"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="topbar-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="topbar-dropdown notif-dropdown">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                <button className="btn btn-ghost btn-sm">Mark all read</button>
              </div>
              <div className="dropdown-list">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`dropdown-item ${n.unread ? 'unread' : ''}`}
                  >
                    <div className="dropdown-item-dot">
                      {n.unread && <span className="status-dot status-dot-orange" />}
                    </div>
                    <div className="dropdown-item-content">
                      <p>{n.text}</p>
                      <span className="dropdown-item-time">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <button className="btn btn-ghost btn-sm">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="topbar-profile-wrapper">
          <button
            className="topbar-profile"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
          >
            <div className="avatar avatar-sm">
              {user?.fullName ? user.fullName.slice(0,2).toUpperCase() : user?.username?.slice(0,2).toUpperCase() || 'U'}
            </div>
            <div className="topbar-profile-info">
              <span className="topbar-profile-name">{user?.fullName || user?.username}</span>
              <span className="topbar-profile-role" style={{ textTransform: 'capitalize' }}>
                {user?.roles?.join(', ').toLowerCase()}
              </span>
            </div>
            <ChevronDown size={14} />
          </button>

          {profileOpen && (
            <div className="topbar-dropdown profile-dropdown">
              <div className="dropdown-item" onClick={handleOpenProfile}>
                <span>My Profile</span>
              </div>
              <div className="dropdown-item">
                <span>Settings</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger" onClick={logout}>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="super-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="super-modal-card card" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700 }}>Edit My Profile</h4>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--text-tertiary)', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}>Full Name</label>
                <input
                  type="text"
                  required
                  style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}>Email Address</label>
                <input
                  type="email"
                  required
                  style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}>Phone Number</label>
                <input
                  type="text"
                  style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left' }}>Change Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary)', color: '#fff' }}>Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
