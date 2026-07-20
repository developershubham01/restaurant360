import React, { useState } from 'react';
import { User, Lock, Phone, Mail, AlertCircle, Loader, Building2, Store, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './Login.css';

export default function Login() {
  const setLoginData = useAuthStore((state) => state.setLoginData);
  const [portalType, setPortalType] = useState<'select' | 'company' | 'branch'>('select');
  


  // Password state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);



  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);



    let authUser = username;
    let authPass = password;

    try {
      const response = await api.post('/api/auth/login', {
        username: authUser,
        password: authPass,
      });

      if (response.data && response.data.success) {
        setLoginData(response.data.data);
        if (portalType === 'branch') {
          useAuthStore.getState().setOutletId(1);
        }
      } else {
        setErrorMsg(response.data?.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK') {
        setErrorMsg('Cannot connect to backend server. Make sure the Spring Boot service is running on port 8080.');
      } else {
        setErrorMsg('Invalid credentials. Please verify and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="login-window login-theme-light">
      {/* Header */}
      <header className="login-top-bar">
        <div className="login-top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/src/assets/logo.png" alt="Restaurant360 Logo" style={{ height: '24px', objectFit: 'contain' }} />
          <span className="portal-sub-tag">Desktop POS Portal</span>
        </div>
        <div className="login-top-bar-right">
          <p className="demo-ref-label">Restaurant360 Cloud ERP</p>
          
        </div>
      </header>

      {/* Main Content */}
      <main className="login-body">
        {/* Left Side Branding */}
        <aside className="login-left-branding" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Glassmorphic Brand Card inside the sidebar */}
          <div className="brand-info-card" style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(254, 215, 170, 0.15)',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '320px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ backgroundColor: '#ffffff', padding: '12px 20px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              <img src="/src/assets/logo.png" alt="Restaurant360 Logo" style={{ maxWidth: '200px', objectFit: 'contain', display: 'block' }} />
            </div>
            
            <h3 style={{ color: '#ea580c', fontSize: '18px', fontWeight: 700, margin: '8px 0 4px 0', letterSpacing: '0.025em' }}>
              Restaurant360 ERP
            </h3>
            <p style={{ color: '#fed7aa', fontSize: '13px', fontWeight: 500, marginBottom: '20px', lineHeight: '1.4' }}>
              Next-Gen Multi-Tenant POS &amp; Dining Ecosystem
            </p>

            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#e2e8f0' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ea580c' }}>⚡</span> Zero-Latency Billing POS
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ea580c' }}>🍳</span> Live Kitchen Display (KDS)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ea580c' }}>📦</span> Recipe-Linked Stock Inventory
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ea580c' }}>📊</span> Corporate ERP Super Admin Panel
              </li>
            </ul>
          </div>
        </aside>

        {/* Center Auth Panel */}
        <section className="login-right-section">
          
          {portalType === 'select' ? (
            <div className="login-card select-portal-card animate-fade-in">
              <h2 className="login-title">Select Login Portal</h2>
              <p className="login-subtitle">Please choose your working ecosystem to continue</p>
              
              <div className="portal-choices-grid">
                <button
                  onClick={() => setPortalType('company')}
                  className="portal-card-btn group"
                >
                  <div className="portal-card-icon-container">
                    <Building2 size={24} />
                  </div>
                  <h3 className="portal-card-title">Corporate ERP</h3>
                  <p className="portal-card-desc">Super Admin panel to manage brands, outlets, licensing and master configurations.</p>
                </button>

                <button
                  onClick={() => setPortalType('branch')}
                  className="portal-card-btn group"
                >
                  <div className="portal-card-icon-container">
                    <Store size={24} />
                  </div>
                  <h3 className="portal-card-title">Restaurant POS</h3>
                  <p className="portal-card-desc">Branch billing counters, chef KDS monitors, table mapping, and staff operations.</p>
                </button>
              </div>

            </div>
          ) : (
            <div className="login-card form-login-card animate-fade-in">
              <div className="login-card-header">
                <button
                  type="button"
                  onClick={() => {
                    setPortalType('select');
                    setErrorMsg(null);
                  }}
                  className="back-to-portal-btn"
                >
                  <ArrowLeft size={16} /> Back to Portals
                </button>
              </div>

              <h2 className="login-form-title">
                {portalType === 'company' ? 'Corporate ERP' : 'Restaurant POS'}
              </h2>
              <p className="login-form-subtitle">Enter credentials to authenticate into system node</p>

              {errorMsg && (
                <div className="login-error-alert animate-fade-in">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="login-form-fields">


                <div className="form-field-group">
                  <label className="form-field-label">Username / Email</label>
                  <div className="form-input-relative">
                    <span className="form-input-icon">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="login-input-field"
                      placeholder="Enter username"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Password</label>
                  <div className="form-input-relative">
                    <span className="form-input-icon">
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input-field"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

            </div>
          )}

        </section>
      </main>

      {/* Footer */}
      <footer className="login-footer-section">
        <div className="login-footer-left">
          <p>
            Need Quick Help? <span className="support-phone"><Phone size={12} /> 99303 38504</span>
          </p>
          <p>
            Contact for Support <span className="support-email"><Mail size={12} /> info@abwcurious.com</span>
          </p>
        </div>
        <div className="login-footer-right">
          <p className="windows-act-msg">Enterprise SaaS</p>
          <p className="portal-version-label">Version : 1.20.26</p>
        </div>
      </footer>
    </div>
  );
}
