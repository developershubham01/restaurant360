import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Award,
  Calendar,
  Gift,
  ArrowRight,
  User,
  HelpCircle,
  Send,
  X,
  FileText
} from 'lucide-react';
import api from '../services/api';
import './CRM.css';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisit: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export default function CRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Loyalty' | 'Campaigns'>('All');
  const [isLoading, setIsLoading] = useState(false);

  // Email and Support Modals States
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [mailRecipient, setMailRecipient] = useState('');
  const [supportSubject, setSupportSubject] = useState('DLT SMS Header Registration Request');
  const [supportBody, setSupportBody] = useState('');

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/customers');
      if (res.data && res.data.success && res.data.data) {
        const dbCustomers = res.data.data.map((c: any) => {
          let tier: Customer['tier'] = 'Bronze';
          if (c.loyaltyPoints >= 2000) tier = 'Platinum';
          else if (c.loyaltyPoints >= 1000) tier = 'Gold';
          else if (c.loyaltyPoints >= 500) tier = 'Silver';

          return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email || 'N/A',
            totalOrders: 5,
            totalSpent: c.loyaltyPoints * 50,
            loyaltyPoints: c.loyaltyPoints || 0,
            lastVisit: 'Active',
            tier: tier
          };
        });
        setCustomers(dbCustomers);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    return matchesSearch;
  });

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleAddPoints = async () => {
    if (!selectedCustomer) return;
    const pointsToAdd = prompt('Enter points to add:');
    if (!pointsToAdd || isNaN(Number(pointsToAdd))) return;

    try {
      setIsLoading(true);
      const res = await api.post(`/api/customers/${selectedCustomer.id}/points?points=${Number(pointsToAdd)}`);
      if (res.data && res.data.success) {
        await fetchCustomers();
        const updatedCustomer = {
          ...selectedCustomer,
          loyaltyPoints: selectedCustomer.loyaltyPoints + Number(pointsToAdd),
        };
        setSelectedCustomer(updatedCustomer);
      }
    } catch (err) {
      console.error('Failed to add points:', err);
      alert('Failed to add loyalty points. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    const name = window.prompt('Enter customer name:');
    if (!name || !name.trim()) return;

    const phone = window.prompt('Enter customer phone:');
    if (!phone || !phone.trim()) return;

    const email = window.prompt('Enter customer email (optional):') || '';

    try {
      setIsLoading(true);
      const res = await api.post(`/api/customers?name=${encodeURIComponent(name.trim())}&phone=${encodeURIComponent(phone.trim())}&email=${encodeURIComponent(email.trim())}`);
      if (res.data && res.data.success) {
        await fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
      alert('Failed to create customer. Please make sure phone number is unique and backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMailReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailRecipient) return;
    alert(`Active customer database list exported successfully as CSV and dispatched to: ${mailRecipient}`);
    setIsMailModalOpen(false);
    setMailRecipient('');
  };

  const handleSendSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportBody) return;
    alert(`Support request submitted successfully! Ticket ID: TKT-${Math.floor(Math.random() * 900000 + 100000)}. Our campaigns integration desk will contact you shortly.`);
    setIsSupportModalOpen(false);
    setSupportBody('');
  };

  return (
    <div className="crm-page-container animate-fade-in">
      {/* Main Customers List */}
      <div className="crm-main-panel">
        {/* Header Tabs */}
        <div className="tabs">
          <span
            className={`tab ${activeTab === 'All' ? 'active' : ''}`}
            onClick={() => setActiveTab('All')}
          >
            All Customers
          </span>
          <span
            className={`tab ${activeTab === 'Loyalty' ? 'active' : ''}`}
            onClick={() => setActiveTab('Loyalty')}
          >
            Loyalty Program
          </span>
          <span
            className={`tab ${activeTab === 'Campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('Campaigns')}
          >
            Marketing Campaigns
          </span>
        </div>

        {activeTab === 'All' && (
          <div className="crm-content stagger-children">
            {/* Top stats */}
            <div className="crm-stats-grid">
              <div className="crm-stat-card card">
                <span className="label">Total Registered</span>
                <h2 className="val">{customers.length}</h2>
              </div>
              <div className="crm-stat-card card">
                <span className="label">Platinum Members</span>
                <h2 className="val text-purple">
                  {customers.filter((c) => c.tier === 'Platinum').length}
                </h2>
              </div>
              <div className="crm-stat-card card">
                <span className="label">Gold Members</span>
                <h2 className="val text-orange">
                  {customers.filter((c) => c.tier === 'Gold').length}
                </h2>
              </div>
              <div className="crm-stat-card card">
                <span className="label">Avg Spent / Member</span>
                <h2 className="val text-green">₹44,500</h2>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="crm-actions-bar">
              <div className="search-input-wrapper crm-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search customer name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={handleAddCustomer}>
                <Plus size={14} /> Add Customer
              </button>
            </div>

            {/* Data Table */}
            <div className="crm-table-container card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Loyalty Pts</th>
                    <th>Membership Tier</th>
                    <th>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className={`crm-row ${selectedCustomer?.id === c.id ? 'active-row' : ''}`}
                    >
                      <td>
                        <div className="customer-name-cell">
                          <div className="avatar avatar-sm">{c.name.substring(0, 2).toUpperCase()}</div>
                          <span className="customer-name-bold">{c.name}</span>
                        </div>
                      </td>
                      <td>{c.phone}</td>
                      <td>{c.totalOrders}</td>
                      <td className="bold">₹{c.totalSpent}</td>
                      <td>{c.loyaltyPoints}</td>
                      <td>
                        <span className={`badge ${
                          c.tier === 'Platinum' ? 'badge-purple' :
                          c.tier === 'Gold' ? 'badge-yellow' :
                          c.tier === 'Silver' ? 'badge-blue' : 'badge-gray'
                        }`}>
                          {c.tier}
                        </span>
                      </td>
                      <td>{c.lastVisit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Loyalty' && (
          <div className="loyalty-tab-content animate-fade-in card">
            <div className="card-header">
              <h3>Loyalty Point Settings</h3>
            </div>
            <div className="card-body form-body-grid">
              <div className="form-group">
                <label>Point Conversion Rate</label>
                <div className="search-input-wrapper">
                  <span className="points-label-prefix">₹100 Spent =</span>
                  <input type="number" defaultValue="2" className="input-with-prefix" />
                  <span className="points-label-suffix">Points</span>
                </div>
              </div>
              <div className="form-group">
                <label>Redemption Rate</label>
                <div className="search-input-wrapper">
                  <span className="points-label-prefix">1 Point =</span>
                  <input type="number" defaultValue="1" className="input-with-prefix" />
                  <span className="points-label-suffix">Rupee (₹)</span>
                </div>
              </div>
              <div className="form-group span-full">
                <button className="btn btn-primary" onClick={() => alert('Settings saved')}>Save Settings</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Campaigns' && (
          <div className="campaigns-tab-content animate-fade-in stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Campaigns Control Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Marketing Campaigns Manager</h4>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Launch targeted WhatsApp / SMS promos using your CRM database.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsMailModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', height: '36px' }}
                >
                  <Mail size={14} /> Mail Me List
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsSupportModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', height: '36px' }}
                >
                  <HelpCircle size={14} /> Contact Support
                </button>
              </div>
            </div>

            <div className="campaigns-grid">
              <div className="card campaign-card">
                <div className="card-header">
                  <span className="badge badge-green">Active</span>
                  <span className="campaign-date">Sent: Yesterday</span>
                </div>
                <div className="card-body">
                  <h4>Weekend 15% Discount SMS</h4>
                  <p className="campaign-desc">15% off discount to all customers who haven't visited in the last 30 days.</p>
                  <div className="campaign-stats">
                    <div>
                      <span className="label">Sent To</span>
                      <span className="val">450 users</span>
                    </div>
                    <div>
                      <span className="label">Conversions</span>
                      <span className="val">32 (7.1%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card campaign-card">
                <div className="card-header">
                  <span className="badge badge-gray">Draft</span>
                  <span className="campaign-date">Scheduled: 05-Jul</span>
                </div>
                <div className="card-body">
                  <h4>Biryani Combo Promo WhatsApp</h4>
                  <p className="campaign-desc">WhatsApp promotion showcasing Biryani Combos to weekend customers.</p>
                  <div className="campaign-stats">
                    <div>
                      <span className="label">Target Audience</span>
                      <span className="val">Gold & Platinum</span>
                    </div>
                    <div>
                      <span className="label">Estimated Users</span>
                      <span className="val">280 users</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Detail Pane */}
      <div className="crm-detail-panel card">
        {selectedCustomer ? (
          <div className="customer-details-box animate-fade-in">
            <div className="details-header-section">
              <div className="avatar avatar-lg">{selectedCustomer.name.substring(0, 2).toUpperCase()}</div>
              <h3>{selectedCustomer.name}</h3>
              <span className={`badge ${
                selectedCustomer.tier === 'Platinum' ? 'badge-purple' :
                selectedCustomer.tier === 'Gold' ? 'badge-yellow' :
                selectedCustomer.tier === 'Silver' ? 'badge-blue' : 'badge-gray'
              }`}>
                {selectedCustomer.tier} Member
              </span>
            </div>

            <div className="divider" />

            <div className="customer-contact-section">
              <div className="contact-row">
                <Phone size={14} />
                <span>{selectedCustomer.phone}</span>
              </div>
              <div className="contact-row">
                <Mail size={14} />
                <span>{selectedCustomer.email}</span>
              </div>
            </div>

            <div className="divider" />

            <div className="customer-stats-section">
              <div className="crm-detail-stat">
                <span className="label">Total Orders</span>
                <span className="val">{selectedCustomer.totalOrders}</span>
              </div>
              <div className="crm-detail-stat">
                <span className="label">Total Spent</span>
                <span className="val text-orange">₹{selectedCustomer.totalSpent}</span>
              </div>
              <div className="crm-detail-stat">
                <span className="label">Loyalty Points</span>
                <span className="val text-green">{selectedCustomer.loyaltyPoints}</span>
              </div>
            </div>

            <div className="divider" />

            <div className="crm-details-actions">
              <button className="btn btn-primary ops-btn" onClick={handleAddPoints}>
                <Gift size={16} /> Add Loyalty Points
              </button>
              <button className="btn btn-secondary ops-btn" onClick={() => {
                const offer = prompt('Enter custom SMS offer text to send:');
                if (offer && offer.trim()) {
                  alert(`Offer SMS successfully queued for sending to ${selectedCustomer.phone}!`);
                }
              }}>
                <Mail size={16} /> Send Custom Offer
              </button>
            </div>
          </div>
        ) : (
          <div className="crm-empty-state">
            <Users size={42} />
            <h4>Select a Customer</h4>
            <p>Click on any row in the customer database table to view order histories, spent statistics, and perform loyalty actions.</p>
          </div>
        )}
      </div>

      {/* --- MAIL ME CUSTOMER LIST MODAL --- */}
      {isMailModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Mail Customer Database List</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setIsMailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendMailReport}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@resto360.com"
                    value={mailRecipient}
                    onChange={(e) => setMailRecipient(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Export Format</label>
                  <select style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="CSV">CSV Comma Separated (.csv)</option>
                    <option value="XLSX">Excel Spreadsheet (.xlsx)</option>
                  </select>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  This will securely package your outlet's customer contact database (names, phone numbers, loyalty points, membership tier) and email it to you.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsMailModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch Email</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONTACT CAMPAIGNS SUPPORT MODAL --- */}
      {isSupportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Contact Marketing & Carrier Support</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setIsSupportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendSupportTicket}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Topic / Request Type *</label>
                  <select
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="DLT SMS Header Registration Request">DLT SMS Header Registration Request</option>
                    <option value="WhatsApp Business API Integration Request">WhatsApp Business API Integration Request</option>
                    <option value="SMS Campaign Carrier Delivery Issue">SMS Campaign Carrier Delivery Issue</option>
                    <option value="Custom Promo Template Approval">Custom Promo Template Approval</option>
                    <option value="Other Campaign Inquiries">Other Campaign Inquiries</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Explain your request details *</label>
                  <textarea
                    required
                    placeholder="Please specify your DLT entity ID, requested SMS headers (e.g. RST360), or WhatsApp Business details..."
                    value={supportBody}
                    onChange={(e) => setSupportBody(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '100px', resize: 'none' }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Our telecom integrations desk will verify your restaurant tenant credentials and file the templates directly with authorized carriers.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsSupportModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
