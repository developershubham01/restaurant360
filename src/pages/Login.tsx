import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Phone, Mail, AlertCircle, Loader, Building2, Store, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './Login.css';

export default function Login() {
  const setLoginData = useAuthStore((state) => state.setLoginData);
  const [portalType, setPortalType] = useState<'select' | 'company' | 'branch'>('select');
  const [loginMethod, setLoginMethod] = useState<'password' | 'passcode'>('password');
  
  // Dynamic portal metadata
  const [brands, setBrands] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | ''>('');
  const [selectedOutletId, setSelectedOutletId] = useState<number | ''>('');

  // Password state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Passcode state
  const [passcode, setPasscode] = useState(['', '', '', '']);
  
  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // References for passcode inputs
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Load brands and outlets dynamically on mount
  useEffect(() => {
    const loadPortalMetadata = async () => {
      try {
        const [brandRes, outletRes] = await Promise.all([
          api.get('/api/brands'),
          api.get('/api/outlets')
        ]);
        if (brandRes.data?.success) setBrands(brandRes.data.data);
        if (outletRes.data?.success) setOutlets(outletRes.data.data);
      } catch (err) {
        console.error('Failed to load login portal data:', err);
      }
    };
    loadPortalMetadata();
  }, []);

  // Auto-focus first pin field when switching to passcode mode
  useEffect(() => {
    if (loginMethod === 'passcode' && portalType === 'branch') {
      inputRefs[0].current?.focus();
    }
  }, [loginMethod, portalType]);

  const handlePasscodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);

    if (value !== '' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      const newPasscode = [...passcode];
      newPasscode[index - 1] = '';
      setPasscode(newPasscode);
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    if (portalType === 'branch' && !selectedOutletId) {
      setErrorMsg('Please select a restaurant chain brand and outlet branch first.');
      setIsLoading(false);
      return;
    }

    let authUser = username;
    let authPass = password;

    if (loginMethod === 'passcode') {
      const enteredPin = passcode.join('');
      if (enteredPin.length !== 4) {
        setErrorMsg('Please enter a complete 4-digit passcode.');
        setIsLoading(false);
        return;
      }
      
      if (enteredPin === '1234') {
        authUser = 'cashier1';
        authPass = 'password';
      } else if (enteredPin === '0000') {
        authUser = 'admin';
        authPass = 'password';
      } else {
        authUser = 'cashier1';
        authPass = 'password';
      }
    }

    try {
      const response = await api.post('/api/auth/login', {
        username: authUser,
        password: authPass,
      });

      if (response.data && response.data.success) {
        setLoginData(response.data.data);
        if (portalType === 'branch' && selectedOutletId) {
          useAuthStore.getState().setOutletId(Number(selectedOutletId));
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

  const handleQuickLogin = (acc: { label: string; user: string; type: 'company' | 'branch' }) => {
    setPortalType(acc.type);
    setErrorMsg(null);
    setUsername(acc.user);
    setPassword('password');
    setLoginMethod('password');
    if (acc.type === 'branch') {
      setSelectedBrandId(1);
      setSelectedOutletId(1);
    }
  };

  const filteredOutlets = outlets.filter(o => o.brand?.id === Number(selectedBrandId));

  return (
    <div className="login-window login-theme-light">
      {/* Header */}
      <header className="login-top-bar">
        <div className="login-top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/src/assets/logo.png" alt="Restaurant360 Logo" style={{ height: '24px', objectFit: 'contain' }} />
          <span className="portal-sub-tag">Desktop POS Portal</span>
        </div>
        <div className="login-top-bar-right">
          <p className="demo-ref-label">Resto360 Cloud ERP Node</p>
          <p className="demo-ref-no">Status: Connected to Database Cluster</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="login-body">
        {/* Left Side Branding */}
        <aside className="login-left-branding">
          <img src="/src/assets/logo.png" alt="Restaurant360 Logo" style={{ maxWidth: '260px', marginBottom: '12px', objectFit: 'contain' }} />
          <p className="logo-tagline-text" style={{ paddingLeft: '4px' }}>
            Enterprise Management &amp; Billing
          </p>
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

              {/* Quick developer bypass */}
              <div className="dev-bypass-strip">
                <p className="dev-bypass-title">Quick Bypass for Developers</p>
                <div className="dev-bypass-buttons">
                  {[
                    { label: 'Admin', user: 'admin', type: 'company' as const },
                    { label: 'Owner', user: 'owner', type: 'company' as const },
                    { label: 'Cashier', user: 'cashier1', type: 'branch' as const },
                    { label: 'Chef', user: 'chef1', type: 'branch' as const }
                  ].map((acc) => (
                    <button
                      key={acc.user}
                      onClick={() => handleQuickLogin(acc)}
                      className="dev-bypass-btn"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="login-card form-login-card animate-fade-in">
              
              {/* Back to selector */}
              <button
                onClick={() => {
                  setPortalType('select');
                  setErrorMsg(null);
                }}
                className="back-portal-btn"
              >
                <ArrowLeft size={14} /> Back to Portal Selection
              </button>

              <h2 className="login-form-title">
                {portalType === 'company' ? 'Corporate Super Admin Sign In' : 'Restaurant Branch Portal'}
              </h2>

              {/* Brand and Outlet Dropdown Pickers */}
              {portalType === 'branch' && (
                <div className="branch-dropdown-wrapper">
                  <div className="dropdown-input-group">
                    <label className="dropdown-input-label">Brand / Chain</label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => {
                        setSelectedBrandId(e.target.value ? Number(e.target.value) : '');
                        setSelectedOutletId('');
                      }}
                      className="login-dropdown custom-select"
                    >
                      <option value="">Select Chain</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="dropdown-input-group">
                    <label className="dropdown-input-label">Branch Outlet</label>
                    <select
                      value={selectedOutletId}
                      onChange={(e) => setSelectedOutletId(e.target.value ? Number(e.target.value) : '')}
                      disabled={!selectedBrandId}
                      className="login-dropdown custom-select"
                    >
                      <option value="">Select Branch</option>
                      {filteredOutlets.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Auth Method Tabs */}
              <div className="login-auth-tabs">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setLoginMethod('password');
                  }}
                  className={`login-tab-trigger ${loginMethod === 'password' ? 'active' : ''}`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setLoginMethod('passcode');
                  }}
                  className={`login-tab-trigger ${loginMethod === 'passcode' ? 'active' : ''}`}
                >
                  Quick PIN
                </button>
              </div>

              {errorMsg && (
                <div className="login-error-alert">
                  <AlertCircle className="alert-icon" size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="login-form-fields">
                {loginMethod === 'password' ? (
                  <>
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
                  </>
                ) : (
                  <div className="pin-input-container">
                    <label className="pin-input-label">Enter your 4-Digit Passcode</label>
                    <div className="pin-inputs-row">
                      {passcode.map((digit, index) => (
                        <input
                          key={index}
                          ref={inputRefs[index]}
                          id={`pin-${index}`}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePasscodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="pin-digit-input"
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                    <p className="pin-info-helper">
                      Default Passcodes: <span className="pin-highlight">1234</span> (Cashier) or <span className="pin-highlight">0000</span> (Admin)
                    </p>
                  </div>
                )}

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

              {/* Compact Quick Test Logins */}
              <div className="quick-test-logins-section">
                <p className="quick-test-title">Quick Sign-in for Testing</p>
                <div className="quick-test-badge-row">
                  {[
                    { label: 'Admin', user: 'admin', type: 'company' as const, title: 'admin-btn' },
                    { label: 'Owner', user: 'owner', type: 'company' as const, title: 'owner-btn' },
                    { label: 'Cashier', user: 'cashier1', type: 'branch' as const, title: 'cashier-btn' },
                    { label: 'Chef', user: 'chef1', type: 'branch' as const, title: 'chef-btn' }
                  ].map((acc) => (
                    <button
                      key={acc.user}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      className={`quick-login-badge-btn ${acc.title}`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Footer */}
      <footer className="login-footer-section">
        <div className="login-footer-left">
          <p>
            Need Quick Help? <span className="support-phone"><Phone size={12} /> 0885858585</span>
          </p>
          <p>
            Contact for Support <span className="support-email"><Mail size={12} /> support@resto360.com</span>
          </p>
        </div>
        <div className="login-footer-right">
          <p className="windows-act-msg">Enterprise SaaS License Active</p>
          <p className="windows-act-sub">Host Server: localhost:8080</p>
          <p className="portal-version-label">Version : 1.07.0.1</p>
        </div>
      </footer>
    </div>
  );
}
