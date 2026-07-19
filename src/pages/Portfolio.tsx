// Portfolio.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Portfolio.css';

interface MockProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
}

interface CartItem {
  product: MockProduct;
  qty: number;
}

const MOCK_PRODUCTS: MockProduct[] = [
  { id: 'p1', name: 'Paneer Tikka Angara', category: 'Appetizers', price: 240, isVeg: true },
  { id: 'p2', name: 'Chicken Seekh Kebab', category: 'Appetizers', price: 290, isVeg: false },
  { id: 'p3', name: 'Butter Chicken Masala', category: 'Mains', price: 380, isVeg: false },
  { id: 'p4', name: 'Paneer Butter Masala', category: 'Mains', price: 320, isVeg: true },
  { id: 'p5', name: 'Kadhai Mushroom', category: 'Mains', price: 280, isVeg: true },
  { id: 'p6', name: 'Chicken Dum Biryani', category: 'Mains', price: 350, isVeg: false },
  { id: 'p7', name: 'Dal Makhani', category: 'Mains', price: 220, isVeg: true },
  { id: 'p8', name: 'Butter Naan', category: 'Mains', price: 60, isVeg: true },
  { id: 'p9', name: 'Gulab Jamun (2 Pcs)', category: 'Desserts', price: 90, isVeg: true },
  { id: 'p10', name: 'Sizzling Brownie', category: 'Desserts', price: 180, isVeg: true },
  { id: 'p11', name: 'Fresh Lime Soda', category: 'Drinks', price: 80, isVeg: true },
  { id: 'p12', name: 'Virgin Mojito', category: 'Drinks', price: 140, isVeg: true }
];

export default function Portfolio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'admin' | 'pos' | 'kds' | 'crm'>('pos');
  const [selectedTable, setSelectedTable] = useState<string>('T2');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Mains');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [invoiceId, setInvoiceId] = useState<string>('');

  // Handle adding items to sandbox cart
  const handleAddToCart = (product: MockProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  // Adjust quantity
  const handleQtyChange = (productId: string, increment: boolean) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = increment ? item.qty + 1 : item.qty - 1;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const cgst = subtotal * 0.025; // 2.5% CGST
  const sgst = subtotal * 0.025; // 2.5% SGST
  const grandTotal = subtotal + cgst + sgst;

  // Print Invoice Action
  const triggerInvoiceGen = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setInvoiceId(`TXN-${randomNum}`);
    setShowReceipt(true);
  };

  const clearCart = () => {
    setCart([]);
  };

  // Filtered sandbox items
  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (vegFilter === 'veg' && !p.isVeg) return false;
    if (vegFilter === 'non-veg' && p.isVeg) return false;
    return true;
  });

  return (
    <div className="pf-container">
      <div className="pf-glow-1"></div>
      <div className="pf-glow-2"></div>

      {/* Header */}
      <header className="pf-header">
        <div className="pf-logo">
          <div className="pf-logo-icon">R</div>
          Resto360
        </div>
        <nav className="pf-nav">
          <a href="#features" className="pf-nav-link">Features</a>
          <a href="#sandbox" className="pf-nav-link">Interactive POS</a>
          <a href="#architecture" className="pf-nav-link">Architecture</a>
          <a href="#schema" className="pf-nav-link">Database</a>
        </nav>
        <button className="pf-btn-primary" onClick={() => navigate('/login')}>
          Launch Application
        </button>
      </header>

      {/* Hero */}
      <section className="pf-hero">
        <div className="pf-hero-tag">ENTERPRISE SAAS SYSTEM</div>
        <h1 className="pf-hero-title">
          The Ultimate Multi-Tenant <span>Restaurant ERP</span> Platform
        </h1>
        <p className="pf-hero-subtitle">
          Manage infinite outlets, generate high-speed tableside POS billing, coordinate real-time Kitchen Displays, and keep your business secure with remote Supabase synchronization.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="#sandbox" style={{ textDecoration: 'none' }}>
            <button className="pf-btn-primary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxShadow: 'none' }}>
              Try Interactive POS
            </button>
          </a>
          <button className="pf-btn-primary" onClick={() => navigate('/login')}>
            Developer Login Portal
          </button>
        </div>

        {/* Stats */}
        <div className="pf-stats-grid">
          <div className="pf-stat-item">
            <span className="pf-stat-number">&lt; 100ms</span>
            <span className="pf-stat-label">Query Latency</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div className="pf-stat-item">
            <span className="pf-stat-number">100%</span>
            <span className="pf-stat-label">RLS Row Security</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div className="pf-stat-item">
            <span className="pf-stat-number">16+</span>
            <span className="pf-stat-label">Database Tables</span>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="pf-showcase">
        <h2 className="pf-section-title">Explore Resto360 Architecture</h2>
        <p className="pf-section-subtitle">A modular design built to withstand high concurrency and latency requirements.</p>

        <div className="pf-tabs-header">
          <button className={`pf-tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            Super Admin Hub
          </button>
          <button className={`pf-tab-btn ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>
            Tableside POS Billing
          </button>
          <button className={`pf-tab-btn ${activeTab === 'kds' ? 'active' : ''}`} onClick={() => setActiveTab('kds')}>
            Kitchen Display System (KDS)
          </button>
          <button className={`pf-tab-btn ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')}>
            CRM & Stock Ledger
          </button>
        </div>

        {activeTab === 'admin' && (
          <div className="pf-tab-panel">
            <div className="pf-panel-info">
              <h3>Tenant Onboarding & Compliance</h3>
              <p>
                Perfect control layer for enterprise operations. Register brands, assign specific resources limits (tables, managers, POS terminals), and audit documentation.
              </p>
              <div className="pf-panel-list">
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Onboard complex restaurant chains in under 30 seconds
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Dynamic verification and approval grid for legal documents
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Automated generated Tenant ID identifiers (REST000XXXX)
                </div>
              </div>
            </div>
            <div className="pf-panel-mockup" style={{ justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
                <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>SaaS Super Admin Console</h4>
                <p style={{ fontSize: '0.85rem' }}>Manage Brands, Verify FSSAI/NDA, Control Subscriptions</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="pf-tab-panel">
            <div className="pf-panel-info">
              <h3>Fast Billing & Table Management</h3>
              <p>
                Highly fluid POS layout designed for rapid tableside ordering. Switch floor maps, track table occupancies, add customized variants, and apply tax categories instantly.
              </p>
              <div className="pf-panel-list">
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Color-coded live status maps (Available, Occupied, Billing)
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Vegetarian/Non-Vegetarian quick-select food flags
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Print-ready receipt generation matching statutory requirements
                </div>
              </div>
            </div>
            <div className="pf-panel-mockup" style={{ justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖥️</div>
                <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Tableside Billing POS</h4>
                <p style={{ fontSize: '0.85rem' }}>Dine-In, Takeaway, Cart Controls, SGST/CGST calculations</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kds' && (
          <div className="pf-tab-panel">
            <div className="pf-panel-info">
              <h3>Real-time Kitchen Operations</h3>
              <p>
                Sync waitstaff orders to the kitchen display screen instantly. Real-time timers ensure orders go out within parameters, and preparation items remain grouped logically.
              </p>
              <div className="pf-panel-list">
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  WebSocket backend integrations for zero-latency updates
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Timer systems highlighting warning parameters on delay
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  KOT ticket prints tracking chef preparation details
                </div>
              </div>
            </div>
            <div className="pf-panel-mockup" style={{ justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍳</div>
                <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Kitchen Display Screen</h4>
                <p style={{ fontSize: '0.85rem' }}>Pending, Preparing, Ready status boards with timer counters</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="pf-tab-panel">
            <div className="pf-panel-info">
              <h3>Dynamic CRM & Inventory Audit Logs</h3>
              <p>
                Record customer transactions, log dynamic reward memberships, adjust stock margins, and track procurement purchase orders automatically.
              </p>
              <div className="pf-panel-list">
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Auto-updated stock levels based on ingredient menus recipes
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Low stock levels triggers highlighting raw inventory shortages
                </div>
                <div className="pf-panel-list-item">
                  <span className="pf-panel-list-icon">✓</span>
                  Purchase order logs audit logs tracking vendor deliveries
                </div>
              </div>
            </div>
            <div className="pf-panel-mockup" style={{ justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Inventory Stock Ledger</h4>
                <p style={{ fontSize: '0.85rem' }}>Procurement, Wastage reports, recipes audit logs</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* POS Sandbox Simulator */}
      <section id="sandbox" className="pf-sandbox">
        <h2 className="pf-section-title">Live Interactive POS Simulator</h2>
        <p className="pf-section-subtitle">Click tables, select cuisines, and add items below to test real-time billing performance.</p>

        <div className="pf-sandbox-grid">
          {/* Col 1: Tables */}
          <div className="pf-sb-card">
            <div className="pf-sb-title">
              <span>Dining Tables</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--pf-primary)' }}>Ground Floor</span>
            </div>
            <div className="pf-table-grid">
              {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map(tNum => (
                <div key={tNum} className={`pf-table-box ${selectedTable === tNum ? 'selected' : ''}`} onClick={() => setSelectedTable(tNum)}>
                  <div className="pf-table-num">{tNum}</div>
                  <div className="pf-table-seats">{tNum === 'T1' || tNum === 'T5' || tNum === 'T11' ? '2 Seats' : '4 Seats'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Menu Products */}
          <div className="pf-sb-card">
            <div className="pf-sb-title">
              <span>Menu Catalog</span>
              <div className="pf-filters">
                <div className="pf-filter-toggle">
                  {['Appetizers', 'Mains', 'Desserts', 'Drinks'].map(cat => (
                    <button key={cat} className={`pf-filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pf-filters" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--pf-text-muted)' }}>Filter Preferences:</span>
              <div className="pf-filter-toggle">
                <button className={`pf-filter-btn ${vegFilter === 'all' ? 'active' : ''}`} onClick={() => setVegFilter('all')}>
                  All
                </button>
                <button className={`pf-filter-btn veg ${vegFilter === 'veg' ? 'active' : ''}`} onClick={() => setVegFilter('veg')}>
                  Veg
                </button>
                <button className={`pf-filter-btn non-veg ${vegFilter === 'non-veg' ? 'active' : ''}`} onClick={() => setVegFilter('non-veg')}>
                  Non-Veg
                </button>
              </div>
            </div>
            <div className="pf-prod-list">
              {filteredProducts.map(prod => (
                <div key={prod.id} className={`pf-prod-item ${prod.isVeg ? 'veg-border' : 'nonveg-border'}`} onClick={() => handleAddToCart(prod)}>
                  <div className="pf-prod-name">{prod.name}</div>
                  <div className="pf-prod-price">₹{prod.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Active Cart */}
          <div className="pf-sb-card">
            <div className="pf-sb-title">
              <span>Order Cart</span>
              <span style={{ fontSize: '0.85rem', color: '#ef4444', cursor: 'pointer' }} onClick={clearCart}>Clear</span>
            </div>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--pf-primary)', fontWeight: 'bold' }}>
              Active: Table {selectedTable}
            </div>

            <div className="pf-cart-items">
              {cart.length === 0 ? (
                <div className="pf-cart-empty">
                  🛒 Cart is empty.<br />Click items in Menu Catalog to load this checkout panel.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="pf-cart-row">
                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                      <div style={{ fontWeight: '600' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--pf-text-muted)' }}>₹{item.product.price} × {item.qty}</div>
                    </div>
                    <div className="pf-cart-qty-ctrl">
                      <button className="pf-cart-qty-btn" onClick={() => handleQtyChange(item.product.id, false)}>-</button>
                      <span style={{ fontSize: '0.9rem', width: '1rem', textAlign: 'center' }}>{item.qty}</span>
                      <button className="pf-cart-qty-btn" onClick={() => handleQtyChange(item.product.id, true)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pf-cart-totals">
              <div className="pf-cart-total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="pf-cart-total-row">
                <span>CGST (2.5%)</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="pf-cart-total-row">
                <span>SGST (2.5%)</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="pf-cart-total-row grand">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button className="pf-sb-btn print" disabled={cart.length === 0} onClick={triggerInvoiceGen}>
              Generate Invoice
            </button>
          </div>
        </div>
      </section>

      {/* Tech Stack Architecture */}
      <section id="architecture" className="pf-architecture">
        <h2 className="pf-section-title">Backend Architecture Blueprints</h2>
        <p className="pf-section-subtitle">Powered by enterprise-grade frameworks ensuring high security, scaling, and zero database downtime.</p>

        <div className="pf-arch-grid">
          <div className="pf-arch-card">
            <span className="pf-arch-icon">☕</span>
            <div className="pf-arch-name">Spring Boot</div>
            <p className="pf-arch-desc">Core REST APIs and security logic. Handles pooled threads via HikariCP for instant database connection processing.</p>
          </div>
          <div className="pf-arch-card">
            <span className="pf-arch-icon">🐘</span>
            <div className="pf-arch-name">PostgreSQL</div>
            <p className="pf-arch-desc">Relational storage layer. Connects directly to Supabase cloud database cluster with low network latency.</p>
          </div>
          <div className="pf-arch-card">
            <span className="pf-arch-icon">⚡</span>
            <div className="pf-arch-name">Flyway DB</div>
            <p className="pf-arch-desc">Automatic schema migration engine. Runs migration versions V1 to V16 cleanly on backend boot updates.</p>
          </div>
          <div className="pf-arch-card">
            <span className="pf-arch-icon">⚛️</span>
            <div className="pf-arch-name">React + TS</div>
            <p className="pf-arch-desc">Frontend client framework. Bundled with Vite to support rapid hot module updates and visual layouts.</p>
          </div>
        </div>
      </section>

      {/* Interactive Schema Explorer */}
      <section id="schema" className="pf-schema">
        <h2 className="pf-section-title">Relational Schema Models</h2>
        <p className="pf-section-subtitle">Examine the core database architecture tables structure.</p>

        <div className="pf-schema-box">
          <div className="pf-schema-tables">
            {/* Table 1: Brands */}
            <div className="pf-schema-table-card">
              <div className="pf-schema-table-name">
                <span>brands</span>
                <span>PK</span>
              </div>
              <div className="pf-schema-columns">
                <div className="pf-schema-col-row pk">
                  <span className="pf-schema-col-name">id</span>
                  <span className="pf-schema-col-type">bigint</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">name</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">owner_email</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">fssai_number</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
              </div>
            </div>

            {/* Table 2: Outlets */}
            <div className="pf-schema-table-card">
              <div className="pf-schema-table-name">
                <span>outlets</span>
                <span>FK</span>
              </div>
              <div className="pf-schema-columns">
                <div className="pf-schema-col-row pk">
                  <span className="pf-schema-col-name">id</span>
                  <span className="pf-schema-col-type">bigint</span>
                </div>
                <div className="pf-schema-col-row fk">
                  <span className="pf-schema-col-name">brand_id</span>
                  <span className="pf-schema-col-type">bigint</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">name</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">address</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
              </div>
            </div>

            {/* Table 3: Dining Tables */}
            <div className="pf-schema-table-card">
              <div className="pf-schema-table-name">
                <span>dining_tables</span>
                <span>FK</span>
              </div>
              <div className="pf-schema-columns">
                <div className="pf-schema-col-row pk">
                  <span className="pf-schema-col-name">id</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">seats</span>
                  <span className="pf-schema-col-type">integer</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">status</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
                <div className="pf-schema-col-row fk">
                  <span className="pf-schema-col-name">floor_id</span>
                  <span className="pf-schema-col-type">bigint</span>
                </div>
              </div>
            </div>

            {/* Table 4: Orders */}
            <div className="pf-schema-table-card">
              <div className="pf-schema-table-name">
                <span>orders</span>
                <span>FK</span>
              </div>
              <div className="pf-schema-columns">
                <div className="pf-schema-col-row pk">
                  <span className="pf-schema-col-name">id</span>
                  <span className="pf-schema-col-type">bigint</span>
                </div>
                <div className="pf-schema-col-row fk">
                  <span className="pf-schema-col-name">outlet_id</span>
                  <span className="pf-schema-col-type">bigint</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">order_number</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
                <div className="pf-schema-col-row">
                  <span className="pf-schema-col-name">status</span>
                  <span className="pf-schema-col-type">varchar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invoice Ticket Modal Overlay */}
      {showReceipt && (
        <div className="pf-receipt-overlay">
          <div className="pf-receipt-card">
            <div className="pf-receipt-header">
              <div className="pf-receipt-title">RESTO 360 BILL</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>SIMULATION CHECKOUT TICKET</div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>DATE: {new Date().toLocaleDateString()}</div>
            </div>
            <div className="pf-receipt-body">
              <div className="pf-receipt-row">
                <span>TICKET ID:</span>
                <span>{invoiceId}</span>
              </div>
              <div className="pf-receipt-row">
                <span>DINING TABLE:</span>
                <span>TABLE {selectedTable}</span>
              </div>
              <div className="pf-receipt-row">
                <span>OPERATOR:</span>
                <span>CASHIER SIM</span>
              </div>

              <div className="pf-receipt-divider"></div>

              {cart.map(item => (
                <div key={item.product.id} className="pf-receipt-row">
                  <span>{item.product.name} (x{item.qty})</span>
                  <span>₹{(item.product.price * item.qty).toFixed(2)}</span>
                </div>
              ))}

              <div className="pf-receipt-divider"></div>

              <div className="pf-receipt-row" style={{ fontWeight: 'bold' }}>
                <span>SUBTOTAL:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="pf-receipt-row">
                <span>CGST (2.5%):</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="pf-receipt-row">
                <span>SGST (2.5%):</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>

              <div className="pf-receipt-divider"></div>

              <div className="pf-receipt-row" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              <div className="pf-receipt-divider" style={{ borderTopStyle: 'double', borderWidth: '3px' }}></div>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                THANK YOU FOR VISITING!
              </div>
            </div>
            <button className="pf-receipt-close" onClick={() => setShowReceipt(false)}>
              Close Simulator Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
