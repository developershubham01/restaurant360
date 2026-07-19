import React, { useState, useEffect } from 'react';
import {
  Building2,
  Store,
  Plus,
  Edit2,
  Users,
  User,
  Shield,
  Activity,
  Terminal,
  Key,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  Database,
  CheckCircle,
  Clock,
  ArrowRight,
  Sliders,
  Play,
  FileText,
  AlertCircle,
  Search,
  Eye,
  Info,
  Mail,
  Smartphone,
  MapPin,
  Globe,
  Settings,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './SuperAdmin.css';

interface SuperAdminProps {
  activeTab?: string;
}

export default function SuperAdmin({ activeTab = 'restaurants_branches' }: SuperAdminProps) {
  const { user: currentUser } = useAuthStore((state) => state);
  
  // Data lists
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [companyMembers, setCompanyMembers] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  
  // Selected restaurant details panel
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  
  // Selected tenant data lists for nested views
  const [tenantBranches, setTenantBranches] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  
  // Modals visibility
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCompanyMemberModal, setShowCompanyMemberModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  // Editing states
  const [editingCompanyMember, setEditingCompanyMember] = useState<any | null>(null);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);

  // Forms
  const [onboardForm, setOnboardForm] = useState({
    restaurantName: '',
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    pinCode: '110001',
    subscriptionPlanId: '',
    trialDays: 14,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    logoUrl: '',
    maxUsersAllowed: 10,
    maxBranchesAllowed: 3
  });

  const [editForm, setEditForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    logoUrl: '',
    maxUsersAllowed: 10,
    maxBranchesAllowed: 3
  });

  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    gst: '',
    manager: '',
    workingHours: '09:00 AM - 11:00 PM',
    tables: 15,
    kitchens: 1,
    printers: 2,
    kds: 1,
    tax: 'CGST 2.5%, SGST 2.5%'
  });

  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    roleName: 'OWNER',
    active: true
  });

  const [companyMemberForm, setCompanyMemberForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    active: true
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    maxUsers: 15,
    maxBranches: 3,
    maxProducts: 500,
    maxTables: 30,
    maxKitchens: 2,
    maxPrinters: 2,
    storageLimitGb: 10.0,
    monthlyPrice: 1999.00,
    yearlyPrice: 19999.00,
    trialDays: 14
  });

  const [renewDays, setRenewDays] = useState(30);
  const [licenseType, setLicenseType] = useState('CLOUD');
  const [licenseDuration, setLicenseDuration] = useState(365);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Backup & DB Admin Simulations
  const [backups, setBackups] = useState<any[]>([
    { id: 1, name: 'Backup_Auto_Weekly_12Jul.sql', size: '4.2 MB', createdAt: '2026-07-12 04:00 AM' },
    { id: 2, name: 'Backup_Pre_Migration_V9.sql', size: '3.8 MB', createdAt: '2026-07-15 10:30 AM' }
  ]);
  const [supportLogs, setSupportLogs] = useState<string[]>([
    'PostgreSQL Cluster replication lag: 0ms',
    'Tenant RLS policy checks executing in < 1ms avg',
    'Vite client hot-reload connection: stable'
  ]);

  // Load basic lists on mount
  useEffect(() => {
    fetchRestaurants();
    fetchOutlets();
    fetchPlans();
    fetchCompanyMembers();
  }, []);

  // Fetch tenant branches and users when tenant is selected
  useEffect(() => {
    if (selectedTenantId) {
      fetchTenantBranches(selectedTenantId);
      fetchTenantUsers(selectedTenantId);
    }
  }, [selectedTenantId]);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/api/brands');
      if (res.data && res.data.success) {
        setRestaurants(res.data.data);
        if (res.data.data.length > 0 && !selectedTenantId) {
          setSelectedTenantId(res.data.data[0].id);
          handleSelectRestaurant(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    }
  };

  const fetchOutlets = async () => {
    try {
      const res = await api.get('/api/outlets');
      if (res.data && res.data.success) {
        setOutlets(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching outlets:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/api/saas/plans');
      if (res.data && res.data.success) {
        setPlans(res.data.data);
        if (res.data.data.length > 0 && !selectedPlanId) {
          setSelectedPlanId(res.data.data[0].id.toString());
          setOnboardForm(prev => ({ ...prev, subscriptionPlanId: res.data.data[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchCompanyMembers = async () => {
    try {
      const res = await api.get('/api/saas/company-members');
      if (res.data && res.data.success) {
        setCompanyMembers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching company members:', err);
    }
  };

  const fetchTenantBranches = async (tenantId: number) => {
    try {
      const res = await api.get(`/api/saas/restaurants/${tenantId}/branches`);
      if (res.data && res.data.success) {
        setTenantBranches(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tenant branches:', err);
    }
  };

  const fetchTenantUsers = async (tenantId: number) => {
    try {
      const res = await api.get(`/api/saas/restaurants/${tenantId}/users`);
      if (res.data && res.data.success) {
        setTenantUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tenant users:', err);
    }
  };

  const handleSelectRestaurant = async (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setSelectedTenantId(restaurant.id);
    // Load feature toggles
    try {
      const res = await api.get('/api/features', { headers: { 'X-Tenant-ID': restaurant.id.toString() } });
      if (res.data && res.data.success) {
        setFeatures(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tenant features:', err);
    }
  };

  // Onboard Restaurant
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/saas/restaurants', onboardForm);
      if (res.data && res.data.success) {
        alert('Restaurant onboarded successfully!');
        setShowOnboardModal(false);
        fetchRestaurants();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to onboard restaurant.');
    }
  };

  // Edit Restaurant details
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    try {
      const res = await api.put(`/api/saas/restaurants/${selectedRestaurant.id}`, editForm);
      if (res.data && res.data.success) {
        alert('Restaurant updated successfully!');
        setShowEditModal(false);
        fetchRestaurants();
        setSelectedRestaurant(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update restaurant.');
    }
  };

  // Renew Subscription
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    try {
      const res = await api.put(`/api/saas/restaurants/${selectedRestaurant.id}/subscription?addDays=${renewDays}`);
      if (res.data && res.data.success) {
        alert(`Extended subscription term by ${renewDays} days!`);
        setShowRenewModal(false);
        fetchRestaurants();
        setSelectedRestaurant(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to renew subscription.');
    }
  };

  // Lock / Unlock Restaurant login
  const handleLockUnlock = async (locked: boolean) => {
    if (!selectedRestaurant) return;
    try {
      const res = await api.put(`/api/saas/restaurants/${selectedRestaurant.id}/${locked ? 'lock' : 'unlock'}`);
      if (res.data && res.data.success) {
        alert(`Restaurant ${locked ? 'locked' : 'unlocked'} successfully.`);
        fetchRestaurants();
        setSelectedRestaurant(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCredentialAction = async (userId: number, endpoint: string, customParam: string = '') => {
    try {
      await api.put(`/api/saas/credentials/${userId}/${endpoint}${customParam}`);
      alert(`Action '${endpoint}' executed successfully!`);
      if (selectedTenantId) {
        fetchTenantUsers(selectedTenantId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Credential action failed.');
    }
  };

  // Suspend / Activate Restaurant
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedRestaurant) return;
    try {
      let url = `/api/saas/restaurants/${selectedRestaurant.id}/status?status=${newStatus}`;
      if (newStatus === 'SUSPENDED') {
        const reason = prompt('Suspension Reason:');
        if (reason === null) return;
        url = `/api/saas/restaurants/${selectedRestaurant.id}/suspend?reason=${encodeURIComponent(reason)}`;
      } else if (newStatus === 'ACTIVE') {
        url = `/api/saas/restaurants/${selectedRestaurant.id}/unsuspend`;
      }
      const res = await api.put(url);
      if (res.data && res.data.success) {
        alert(`Status updated to ${newStatus}`);
        fetchRestaurants();
        setSelectedRestaurant(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Restaurant (Archive)
  const handleDeleteRestaurant = async () => {
    if (!selectedRestaurant) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRestaurant.name}?`)) return;
    try {
      const res = await api.delete(`/api/saas/restaurants/${selectedRestaurant.id}`);
      if (res.data && res.data.success) {
        alert('Restaurant archived successfully');
        fetchRestaurants();
        setSelectedRestaurant(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Module features
  const handleToggleModule = async (moduleKey: string, currentVal: boolean) => {
    if (!selectedRestaurant) return;
    try {
      const res = await api.put(`/api/saas/restaurants/${selectedRestaurant.id}/features?moduleKey=${moduleKey}&enabled=${!currentVal}`);
      if (res.data && res.data.success) {
        setFeatures(prev => ({ ...prev, [moduleKey]: !currentVal }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Branch under Tenant
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    try {
      const params = new URLSearchParams();
      params.append('name', branchForm.name);
      params.append('code', branchForm.code);
      params.append('address', branchForm.address);
      params.append('phone', branchForm.phone);
      params.append('gst', branchForm.gst);
      params.append('manager', branchForm.manager);
      params.append('workingHours', branchForm.workingHours);
      params.append('tables', branchForm.tables.toString());
      params.append('kitchens', branchForm.kitchens.toString());
      params.append('printers', branchForm.printers.toString());
      params.append('kds', branchForm.kds.toString());
      params.append('tax', branchForm.tax);

      if (editingBranchId) {
        await api.put(`/api/saas/branches/${editingBranchId}?${params.toString()}`);
        alert('Branch updated successfully!');
      } else {
        await api.post(`/api/saas/restaurants/${selectedTenantId}/branches?${params.toString()}`);
        alert('Branch onboarded successfully!');
      }

      setShowAddBranchModal(false);
      setEditingBranchId(null);
      fetchTenantBranches(selectedTenantId);
      fetchOutlets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save branch.');
    }
  };

  // Create/Upgrade Tier Plan
  const handlePlanUpgrade = async () => {
    if (!selectedRestaurant) return;
    try {
      const res = await api.put(`/api/saas/restaurants/${selectedRestaurant.id}/subscription?planId=${selectedPlanId}`);
      if (res.data && res.data.success) {
        alert('Subscription plan updated!');
        fetchRestaurants();
        setSelectedRestaurant(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create/Update SaaS Subscription Plans
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/api/saas/plans/${editingPlan.id}`, planForm);
        alert('Subscription plan updated successfully!');
      } else {
        await api.post('/api/saas/plans', planForm);
        alert('Subscription plan created successfully!');
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (id: number) => {
    if (!window.confirm('Delete this plan tier?')) return;
    try {
      await api.delete(`/api/saas/plans/${id}`);
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  // Create/Add Restaurant user (Owner, Chef, Cashier, Waiter)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    try {
      const params = new URLSearchParams();
      params.append('fullName', userForm.fullName);
      params.append('username', userForm.username);
      params.append('email', userForm.email);
      params.append('password', userForm.password);
      params.append('phone', userForm.phone);
      params.append('roleName', userForm.roleName);
      params.append('active', String(userForm.active));

      await api.post(`/api/saas/restaurants/${selectedTenantId}/users?${params.toString()}`);
      alert('Staff user registered successfully!');
      setShowAddUserModal(false);
      fetchTenantUsers(selectedTenantId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register staff user.');
    }
  };

  // Save/Edit Company Member
  const handleSaveCompanyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('fullName', companyMemberForm.fullName);
      params.append('email', companyMemberForm.email);
      if (companyMemberForm.phone) params.append('phone', companyMemberForm.phone);
      params.append('active', String(companyMemberForm.active));

      if (editingCompanyMember) {
        if (companyMemberForm.password) params.append('password', companyMemberForm.password);
        await api.put(`/api/saas/company-members/${editingCompanyMember.id}?${params.toString()}`);
        alert('Company member updated successfully!');
      } else {
        params.append('username', companyMemberForm.username);
        params.append('password', companyMemberForm.password);
        await api.post(`/api/saas/company-members?${params.toString()}`);
        alert('Company member created successfully!');
      }
      setShowCompanyMemberModal(false);
      setEditingCompanyMember(null);
      fetchCompanyMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save company member.');
    }
  };

  // Delete Company Member
  const handleDeleteCompanyMember = async (id: number) => {
    if (currentUser && currentUser.username === companyMembers.find(m => m.id === id)?.username) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this company member?')) return;
    try {
      await api.delete(`/api/saas/company-members/${id}`);
      alert('Company member deleted.');
      fetchCompanyMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete company member.');
    }
  };

  // Generate SaaS License Key
  const handleGenerateLicense = async () => {
    if (!selectedRestaurant) return;
    try {
      const res = await api.post(`/api/saas/restaurants/${selectedRestaurant.id}/licenses?type=${licenseType}&durationDays=${licenseDuration}`);
      if (res.data && res.data.success) {
        alert(`New License Key Generated:\n${res.data.data.licenseKey}`);
        setShowLicenseModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate license key.');
    }
  };

  // Backup & Restore
  const triggerBackup = () => {
    const filename = `Backup_Manual_${new Date().getTime().toString().substring(8)}.sql`;
    setBackups(prev => [
      { id: prev.length + 1, name: filename, size: '4.0 MB', createdAt: new Date().toLocaleString() },
      ...prev
    ]);
    alert('SaaS PostgreSQL Cluster database backup generated successfully.');
  };

  const restoreBackup = (name: string) => {
    if (confirm(`Restore database to state: ${name}?`)) {
      alert(`Database successfully restored to ${name}.`);
    }
  };

  // Filtered lists
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.ownerMobile.includes(searchQuery);
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  return (
    <div className="super-admin-content animate-fade-in">
      
      {/* SECTION 2: Restaurants & Branches */}
      {activeTab === 'restaurants_branches' && (
        <div className="saas-workspace-grid">
          
          {/* Left: Restaurant list */}
          <div className="saas-list-section card">
            <div className="saas-list-header flex-col" style={{ gap: '12px' }}>
              <div className="flex-row-between w-full">
                <h3>Restaurants</h3>
                <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => setShowOnboardModal(true)}>
                  <Plus size={14} /> Onboard Brand
                </button>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-2 w-full">
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search name, owner..."
                    className="super-search-input"
                    style={{ paddingLeft: '32px', height: '34px', fontSize: '13px', width: '100%' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  style={{ height: '34px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0 4px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="saas-list-table-container">
              <table className="super-table">
                <thead>
                  <tr>
                    <th>Brand Name</th>
                    <th>Plan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => handleSelectRestaurant(r)}
                      className={`selectable-row ${selectedRestaurant?.id === r.id ? 'selected' : ''}`}
                    >
                      <td>
                        <strong>{r.name}</strong>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{r.city}, {r.state}</div>
                      </td>
                      <td>
                        <span className="badge badge-orange">{r.subscriptionPlan?.name || 'Basic'}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${r.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Selected Restaurant and Branches */}
          <div className="saas-detail-section card" style={{ overflowY: 'auto', maxHeight: '720px' }}>
            {selectedRestaurant ? (
              <div className="tenant-control-panel animate-fade-in" style={{ padding: '0' }}>
                
                {/* Brand Details Card */}
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                  <div className="flex-row-between">
                    <div>
                      <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedRestaurant.name}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>UUID: {selectedRestaurant.uuid}</span>
                    </div>
                    <span className="badge badge-orange">ID: {selectedRestaurant.id}</span>
                  </div>

                  <div className="tenant-metadata-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div className="meta-item flex gap-2 items-center">
                      <User size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Owner</span>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedRestaurant.ownerName}</strong>
                      </div>
                    </div>
                    <div className="meta-item flex gap-2 items-center">
                      <Mail size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Email</span>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedRestaurant.ownerEmail}</strong>
                      </div>
                    </div>
                    <div className="meta-item flex gap-2 items-center">
                      <Smartphone size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Phone</span>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedRestaurant.ownerMobile}</strong>
                      </div>
                    </div>
                    <div className="meta-item flex gap-2 items-center">
                      <Globe size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>PAN & GSTIN</span>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{selectedRestaurant.panNumber || 'N/A'} | {selectedRestaurant.gstNumber || 'N/A'}</strong>
                      </div>
                    </div>
                    <div className="meta-item flex gap-2 items-center" style={{ gridColumn: 'span 2' }}>
                      <MapPin size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Address</span>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{selectedRestaurant.address}, {selectedRestaurant.city}, {selectedRestaurant.state}, {selectedRestaurant.pinCode}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => {
                        setEditForm({
                          name: selectedRestaurant.name || '',
                          ownerName: selectedRestaurant.ownerName || '',
                          ownerEmail: selectedRestaurant.ownerEmail || '',
                          ownerMobile: selectedRestaurant.ownerMobile || '',
                          gstNumber: selectedRestaurant.gstNumber || '',
                          panNumber: selectedRestaurant.panNumber || '',
                          address: selectedRestaurant.address || '',
                          city: selectedRestaurant.city || '',
                          state: selectedRestaurant.state || '',
                          country: selectedRestaurant.country || '',
                          pinCode: selectedRestaurant.pinCode || '',
                          currency: selectedRestaurant.currency || 'INR',
                          timezone: selectedRestaurant.timezone || 'Asia/Kolkata',
                          logoUrl: selectedRestaurant.logoUrl || '',
                          maxUsersAllowed: selectedRestaurant.maxUsersAllowed || 10,
                          maxBranchesAllowed: selectedRestaurant.maxBranchesAllowed || 3
                        });
                        setShowEditModal(true);
                      }}
                    >
                      <Edit2 size={12} /> Edit Details
                    </button>
                    {selectedRestaurant.status === 'ACTIVE' ? (
                      <button className="btn btn-outline btn-xs text-yellow-500" onClick={() => handleStatusChange('SUSPENDED')}>
                        <AlertTriangle size={12} /> Suspend
                      </button>
                    ) : (
                      <button className="btn btn-outline btn-xs text-green-500" onClick={() => handleStatusChange('ACTIVE')}>
                        <CheckCircle size={12} /> Activate
                      </button>
                    )}
                    <button className="btn btn-outline btn-xs text-purple-500" onClick={() => handleLockUnlock(!selectedRestaurant.locked)}>
                      {selectedRestaurant.locked ? <><Unlock size={12} /> Unlock Access</> : <><Lock size={12} /> Lock Access</>}
                    </button>
                    <button className="btn btn-outline btn-xs text-red-500" onClick={handleDeleteRestaurant}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>

                {/* Compliance & Legal Documents Section */}
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <h5 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Compliance & Legal Documents</h5>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {[
                      { key: 'SLA', label: 'Service Level Agreement (SLA)', status: selectedRestaurant.slaStatus, url: selectedRestaurant.slaUrl },
                      { key: 'NDA', label: 'Data Privacy / NDA', status: selectedRestaurant.ndaStatus, url: selectedRestaurant.ndaUrl },
                      { key: 'LICENSE', label: 'Software License Agreement', status: selectedRestaurant.licenseAgreementStatus, url: selectedRestaurant.licenseAgreementUrl },
                      { key: 'GST', label: 'GST Registration Certificate', status: selectedRestaurant.gstCertStatus, url: selectedRestaurant.gstCertUrl },
                      { key: 'PAN_AADHAR', label: 'Owner PAN & Aadhar Card', status: selectedRestaurant.panAadharStatus, url: selectedRestaurant.panAadharUrl },
                      { key: 'FSSAI', label: 'FSSAI Verification License', status: selectedRestaurant.fssaiCertStatus, url: selectedRestaurant.fssaiCertUrl }
                    ].map(doc => {
                      const getStatusBadge = (status: string) => {
                        const s = (status || 'PENDING').toUpperCase();
                        switch (s) {
                          case 'VERIFIED':
                            return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>Verified</span>;
                          case 'REJECTED':
                            return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Rejected</span>;
                          case 'UPLOADED':
                            return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Uploaded</span>;
                          default:
                            return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.2)' }}>Pending</span>;
                        }
                      };

                      const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('documentType', doc.key);
                        
                        try {
                          const res = await api.post(`/api/saas/restaurants/${selectedRestaurant.id}/documents`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          if (res.data && res.data.success) {
                            alert(`${doc.label} uploaded successfully!`);
                            fetchRestaurants();
                            setSelectedRestaurant(res.data.data);
                          }
                        } catch (err: any) {
                          alert(err.response?.data?.message || `Failed to upload ${doc.label}`);
                        }
                      };

                      const handleVerifyStatus = async (status: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
                        try {
                          const res = await api.put(`/api/saas/restaurants/${selectedRestaurant.id}/documents/verify?documentType=${doc.key}&status=${status}`);
                          if (res.data && res.data.success) {
                            alert(`Status updated to ${status} for ${doc.label}`);
                            fetchRestaurants();
                            setSelectedRestaurant(res.data.data);
                          }
                        } catch (err: any) {
                          alert(err.response?.data?.message || `Failed to update status.`);
                        }
                      };

                      return (
                        <div key={doc.key} className="super-stat-card flex-col" style={{ alignItems: 'stretch', gap: '12px', padding: '16px' }}>
                          <div className="flex-row-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{doc.label}</span>
                            {getStatusBadge(doc.status)}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                            {doc.url && (
                              <button 
                                className="btn btn-outline btn-xs"
                                onClick={async () => {
                                  try {
                                    const response = await api.get(doc.url, { responseType: 'blob' });
                                    const blob = new Blob([response.data], { type: response.headers['content-type'] });
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `${doc.key.toLowerCase()}_document_${selectedRestaurant.id}.pdf`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                  } catch (err) {
                                    alert('Failed to download document. Please ensure it exists on the server.');
                                  }
                                }}
                              >
                                View / Download
                              </button>
                            )}

                            {(!doc.status || doc.status === 'PENDING' || doc.status === 'REJECTED') && (
                              <label className="btn btn-primary btn-xs" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                                Upload
                                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleUploadFile} />
                              </label>
                            )}

                            {doc.status === 'UPLOADED' && (
                              <>
                                <button className="btn btn-xs text-green-500 btn-outline" onClick={() => handleVerifyStatus('VERIFIED')}>
                                  Verify
                                </button>
                                <button className="btn btn-xs text-red-500 btn-outline" onClick={() => handleVerifyStatus('REJECTED')}>
                                  Reject
                                </button>
                              </>
                            )}

                            {doc.status === 'VERIFIED' && (
                              <button className="btn btn-xs text-yellow-500 btn-outline" onClick={() => handleVerifyStatus('PENDING')}>
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Branches Subsection */}
                <div style={{ marginTop: '24px' }}>
                  <div className="flex-row-between" style={{ marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Branch Outlets ({tenantBranches.length})</h5>
                    <button className="btn btn-primary btn-xs" onClick={() => {
                      setEditingBranchId(null);
                      setBranchForm({
                        name: '', code: '', address: '', phone: '', gst: '', manager: '',
                        workingHours: '09:00 AM - 11:00 PM', tables: 15, kitchens: 1, printers: 2, kds: 1, tax: 'CGST 2.5%, SGST 2.5%'
                      });
                      setShowAddBranchModal(true);
                    }}>
                      <Plus size={12} /> Add Branch
                    </button>
                  </div>

                  <div className="saas-list-table-container">
                    <table className="super-table w-full">
                      <thead>
                        <tr>
                          <th>Branch Code & Name</th>
                          <th>Manager</th>
                          <th>Hardware Load</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantBranches.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-tertiary)' }}>No branch outlets registered under this tenant.</td>
                          </tr>
                        ) : (
                          tenantBranches.map(b => (
                            <tr key={b.id}>
                              <td>
                                <strong>{b.name}</strong>
                                <div style={{ fontSize: '10px', color: 'var(--primary)', fontFamily: 'monospace' }}>Code: {b.branchCode || `BR-${b.id}`}</div>
                              </td>
                              <td style={{ fontSize: '12px' }}>{b.managerName || 'N/A'}</td>
                              <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {b.tablesCount} Tables | {b.kdsCount} KDS | {b.printersCount} Print
                              </td>
                              <td>
                                <button className="btn btn-outline btn-xs" onClick={() => {
                                  setEditingBranchId(b.id);
                                  setBranchForm({
                                    name: b.name || '',
                                    code: b.branchCode || '',
                                    address: b.address || '',
                                    phone: b.phone || '',
                                    gst: b.gstNumber || '',
                                    manager: b.managerName || '',
                                    workingHours: b.workingHours || '09:00 AM - 11:00 PM',
                                    tables: b.tablesCount || 10,
                                    kitchens: b.kitchensCount || 1,
                                    printers: b.printersCount || 1,
                                    kds: b.kdsCount || 1,
                                    tax: b.taxDetails || 'CGST 2.5%, SGST 2.5%'
                                  });
                                  setShowAddBranchModal(true);
                                }}>
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="saas-detail-empty">
                <Building2 size={48} className="text-slate-400" />
                <p>Select a Restaurant Tenant from the list to manage details and branches.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION 3: Staff User Accounts */}
      {activeTab === 'staff_accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="section-card card">
            <div className="section-title-bar">
              <div>
                <h3>Restaurant Operator Accounts</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Direct CRUD management of Owner, Chef, and Cashier accounts for the selected restaurant.</p>
              </div>
              <div className="flex gap-2">
                <select
                  style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0 8px' }}
                  value={selectedTenantId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedTenantId(id);
                    const found = restaurants.find(r => r.id === id);
                    if (found) setSelectedRestaurant(found);
                  }}
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm" disabled={!selectedTenantId} onClick={() => {
                  setUserForm({ fullName: '', username: '', email: '', password: '', phone: '', roleName: 'CASHIER', active: true });
                  setShowAddUserModal(true);
                }}>
                  <Plus size={14} /> Add Staff Account
                </button>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="saas-list-table-container">
                <table className="super-table w-full">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email Address</th>
                      <th>Username</th>
                      <th>Operational Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>No staff registered. Select a restaurant and click Add Staff Account above.</td>
                      </tr>
                    ) : (
                      tenantUsers.map(u => (
                        <tr key={u.id}>
                          <td><strong>{u.fullName}</strong></td>
                          <td>{u.email}</td>
                          <td style={{ fontFamily: 'monospace' }}>{u.username}</td>
                          <td>
                            <span className="badge badge-orange">
                              {u.roles && u.roles.length > 0 ? u.roles[0].name : 'CASHIER'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.active ? 'active' : 'inactive'}`}>
                              {u.active ? 'ACTIVE' : 'LOCKED'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-outline btn-xs text-yellow-500"
                              onClick={() => {
                                const pass = prompt('Enter new password for this user:');
                                if (pass) {
                                  handleCredentialAction(u.id, 'reset-password', `?newPassword=${encodeURIComponent(pass)}`);
                                }
                              }}
                              style={{ marginRight: '6px' }}
                            >
                              Password Reset
                            </button>
                            <button
                              className={`btn btn-outline btn-xs ${u.active ? 'text-red-500' : 'text-green-500'}`}
                              onClick={() => handleCredentialAction(u.id, u.active ? 'lock' : 'unlock')}
                            >
                              {u.active ? 'Lock' : 'Unlock'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 4: Subscription & Plans */}
      {activeTab === 'subscription_reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Subscription Renewals & Tiers */}
          <div className="section-card card">
            <div className="section-title-bar">
              <h3>Restaurant Subscription Renewal</h3>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select Restaurant Tenant</label>
                <select
                  style={{ height: '38px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0 8px' }}
                  value={selectedTenantId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedTenantId(id);
                    const found = restaurants.find(r => r.id === id);
                    if (found) handleSelectRestaurant(found);
                  }}
                >
                  <option value="">Choose Restaurant</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (Plan: {r.subscriptionPlan?.name || 'Basic'})</option>
                  ))}
                </select>
              </div>

              {selectedRestaurant && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Expiry Date</span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedRestaurant.expiresAt ? new Date(selectedRestaurant.expiresAt).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Status</span>
                      <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>{selectedRestaurant.status}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm flex-1" onClick={() => setShowRenewModal(true)}>
                      <RefreshCw size={13} /> Renew Subscription Terms
                    </button>
                    <button className="btn btn-outline btn-sm flex-1" onClick={() => setShowLicenseModal(true)}>
                      <Key size={13} /> Generate License Key
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Upgrade Billing Tier</label>
                    <div className="flex gap-2">
                      <select
                        style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', flex: 1, padding: '0 8px' }}
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₹{p.monthlyPrice}/mo)</option>
                        ))}
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={handlePlanUpgrade}>Apply Upgrade</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SaaS Plan Configuration CRUD */}
          <div className="section-card card">
            <div className="section-title-bar">
              <h3>SaaS Subscription Plans</h3>
              <button className="btn btn-primary btn-xs" onClick={() => {
                setEditingPlan(null);
                setPlanForm({ name: '', maxUsers: 15, maxBranches: 3, maxProducts: 500, maxTables: 30, maxKitchens: 2, maxPrinters: 2, storageLimitGb: 10.0, monthlyPrice: 1999.00, yearlyPrice: 19999.00, trialDays: 14 });
                setShowPlanModal(true);
              }}>
                <Plus size={12} /> Add Tier
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div className="saas-list-table-container" style={{ maxHeight: '360px' }}>
                <table className="super-table w-full">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Monthly (₹)</th>
                      <th>Limits</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>₹{p.monthlyPrice}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {p.maxBranches} Branches | {p.maxUsers} Users
                        </td>
                        <td>
                          <button className="btn btn-outline btn-xs" style={{ marginRight: '4px' }} onClick={() => {
                            setEditingPlan(p);
                            setPlanForm({
                              name: p.name || '', maxUsers: p.maxUsers || 10, maxBranches: p.maxBranches || 3, maxProducts: p.maxProducts || 500,
                              maxTables: p.maxTables || 30, maxKitchens: p.maxKitchens || 2, maxPrinters: p.maxPrinters || 2, storageLimitGb: p.storageLimitGb || 10.0,
                              monthlyPrice: p.monthlyPrice || 999.00, yearlyPrice: p.yearlyPrice || 9999.00, trialDays: p.trialDays || 14
                            });
                            setShowPlanModal(true);
                          }}>
                            Edit
                          </button>
                          <button className="btn btn-outline btn-xs text-red-500" onClick={() => handleDeletePlan(p.id)}>
                            Del
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SECTION 5: Support to Restaurant */}
      {activeTab === 'support_ops' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* PostgreSQL Cluster Backup & Restore */}
          <div className="section-card card">
            <div className="section-title-bar">
              <h3>PostgreSQL Backup &amp; Restore</h3>
              <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={triggerBackup}>
                <Database size={13} /> Trigger Backup
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                centralized PostgreSQL cluster backup node. Restore points enforce tenant RLS metadata alignments.
              </p>
              <div className="saas-list-table-container">
                <table className="super-table w-full">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Restore Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{b.name}</td>
                        <td>{b.size}</td>
                        <td>
                          <button className="btn btn-outline btn-xs" onClick={() => restoreBackup(b.name)}>
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Module control / Feature toggles */}
          <div className="section-card card">
            <div className="section-title-bar">
              <h3>Centralized Module Control</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Select Restaurant Tenant</label>
                <select
                  style={{ height: '38px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0 8px' }}
                  value={selectedTenantId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedTenantId(id);
                    const found = restaurants.find(r => r.id === id);
                    if (found) handleSelectRestaurant(found);
                  }}
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {selectedRestaurant ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  {[
                    { key: 'POS', label: 'POS Billing System' },
                    { key: 'KITCHEN_DISPLAY', label: 'KDS Screens' },
                    { key: 'CRM', label: 'CRM & Loyalty' },
                    { key: 'INVENTORY', label: 'Inventory Control' },
                    { key: 'QR_ORDERING', label: 'QR Table Ordering' },
                    { key: 'ONLINE_ORDERS', label: 'Aggregator Integrations' },
                    { key: 'AI_REPORTS', label: 'AI Demand Forecasts' },
                    { key: 'RECIPE_MANAGEMENT', label: 'Recipe Costs Management' }
                  ].map(mod => (
                    <div key={mod.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{mod.label}</span>
                      <button
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: features[mod.key] ? 'var(--primary)' : 'var(--text-tertiary)' }}
                        onClick={() => handleToggleModule(mod.key, !!features[mod.key])}
                      >
                        {features[mod.key] ? <CheckCircle size={18} /> : <Clock size={18} />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>Please select a restaurant tenant to toggle active modules.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 6: Company Members */}
      {activeTab === 'company_members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="section-card card">
            <div className="section-title-bar">
              <div>
                <h3>Company Members (Super Admin Access)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Manage internal administrative operators who have full bypass access to control all tenant restaurants.</p>
              </div>
              <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => {
                setEditingCompanyMember(null);
                setCompanyMemberForm({ fullName: '', username: '', email: '', password: '', phone: '', active: true });
                setShowCompanyMemberModal(true);
              }}>
                <Plus size={14} /> Add Company Member
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="saas-list-table-container">
                <table className="super-table w-full">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email address</th>
                      <th>Admin Username</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyMembers.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.fullName}</strong></td>
                        <td>{m.email}</td>
                        <td style={{ fontFamily: 'monospace' }}>{m.username}</td>
                        <td>{m.phone || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${m.active ? 'active' : 'inactive'}`}>
                            {m.active ? 'ACTIVE' : 'LOCKED'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => {
                              setEditingCompanyMember(m);
                              setCompanyMemberForm({
                                fullName: m.fullName || '',
                                username: m.username || '',
                                email: m.email || '',
                                password: '',
                                phone: m.phone || '',
                                active: m.active
                              });
                              setShowCompanyMemberModal(true);
                            }}
                            style={{ marginRight: '6px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline btn-xs text-red-500"
                            onClick={() => handleDeleteCompanyMember(m.id)}
                            disabled={currentUser && currentUser.username === m.username}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODALS */}
      
      {/* 1. Onboard Restaurant Modal */}
      {showOnboardModal && (
        <div className="super-modal-overlay">
          <div className="super-modal-wide max-w-lg">
            <div className="super-modal-header">
              <h4>Onboard New Restaurant</h4>
              <button className="close-btn" onClick={() => setShowOnboardModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Restaurant Name *</label>
                  <input type="text" required className="super-input" value={onboardForm.restaurantName} onChange={e => setOnboardForm({...onboardForm, restaurantName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Name *</label>
                  <input type="text" required className="super-input" value={onboardForm.ownerName} onChange={e => setOnboardForm({...onboardForm, ownerName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" required className="super-input" value={onboardForm.ownerEmail} onChange={e => setOnboardForm({...onboardForm, ownerEmail: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input type="text" required className="super-input" value={onboardForm.ownerMobile} onChange={e => setOnboardForm({...onboardForm, ownerMobile: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input type="text" className="super-input" value={onboardForm.gstNumber} onChange={e => setOnboardForm({...onboardForm, gstNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Card</label>
                  <input type="text" className="super-input" value={onboardForm.panNumber} onChange={e => setOnboardForm({...onboardForm, panNumber: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Registered Address *</label>
                  <input type="text" required className="super-input" value={onboardForm.address} onChange={e => setOnboardForm({...onboardForm, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input type="text" required className="super-input" value={onboardForm.city} onChange={e => setOnboardForm({...onboardForm, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input type="text" required className="super-input" value={onboardForm.state} onChange={e => setOnboardForm({...onboardForm, state: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subscription Tier *</label>
                  <select required className="super-select" value={onboardForm.subscriptionPlanId} onChange={e => setOnboardForm({...onboardForm, subscriptionPlanId: e.target.value})}>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.monthlyPrice}/mo)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trial Period (Days)</label>
                  <input type="number" className="super-input" value={onboardForm.trialDays} onChange={e => setOnboardForm({...onboardForm, trialDays: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOnboardModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Onboard Restaurant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Renew Subscription Modal */}
      {showRenewModal && (
        <div className="super-modal-overlay">
          <div className="super-modal max-w-sm">
            <div className="super-modal-header">
              <h4>Extend Subscription Terms</h4>
              <button className="close-btn" onClick={() => setShowRenewModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRenewSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Expiry Extension Term</label>
                <select className="super-select" value={renewDays} onChange={e => setRenewDays(Number(e.target.value))}>
                  <option value={30}>Add 30 Days (1 Month)</option>
                  <option value={90}>Add 90 Days (3 Months)</option>
                  <option value={180}>Add 180 Days (6 Months)</option>
                  <option value={365}>Add 365 Days (1 Year)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRenewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Renewal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Generate License Key Modal */}
      {showLicenseModal && (
        <div className="super-modal-overlay">
          <div className="super-modal max-w-sm">
            <div className="super-modal-header">
              <h4>Generate SaaS License Key</h4>
              <button className="close-btn" onClick={() => setShowLicenseModal(false)}>&times;</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">License Type</label>
                <select className="super-select" value={licenseType} onChange={e => setLicenseType(e.target.value)}>
                  <option value="CLOUD">Cloud Access</option>
                  <option value="OFFLINE">Offline Backup Cache</option>
                  <option value="DESKTOP">Local Desktop Instance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Days)</label>
                <input type="number" className="super-input" value={licenseDuration} onChange={e => setLicenseDuration(Number(e.target.value))} />
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn btn-secondary" onClick={() => setShowLicenseModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleGenerateLicense}>Generate Key</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Restaurant Modal */}
      {showEditModal && (
        <div className="super-modal-overlay">
          <div className="super-modal-wide max-w-lg">
            <div className="super-modal-header">
              <h4>Edit Restaurant Details</h4>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Brand Name *</label>
                  <input type="text" required className="super-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Name *</label>
                  <input type="text" required className="super-input" value={editForm.ownerName} onChange={e => setEditForm({...editForm, ownerName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" required className="super-input" value={editForm.ownerEmail} onChange={e => setEditForm({...editForm, ownerEmail: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input type="text" required className="super-input" value={editForm.ownerMobile} onChange={e => setEditForm({...editForm, ownerMobile: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input type="text" className="super-input" value={editForm.gstNumber} onChange={e => setEditForm({...editForm, gstNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Card</label>
                  <input type="text" className="super-input" value={editForm.panNumber} onChange={e => setEditForm({...editForm, panNumber: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Registered Address *</label>
                  <input type="text" required className="super-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input type="text" required className="super-input" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input type="text" required className="super-input" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add/Edit Branch Modal */}
      {showAddBranchModal && (
        <div className="super-modal-overlay">
          <div className="super-modal-wide max-w-lg">
            <div className="super-modal-header">
              <h4>{editingBranchId ? 'Edit Branch Outlet' : 'Add Branch Outlet'}</h4>
              <button className="close-btn" onClick={() => setShowAddBranchModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Branch Name *</label>
                  <input type="text" required className="super-input" value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Code *</label>
                  <input type="text" required className="super-input" value={branchForm.code} onChange={e => setBranchForm({...branchForm, code: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Branch Address *</label>
                  <input type="text" required className="super-input" value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Line</label>
                  <input type="text" className="super-input" value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch GSTIN</label>
                  <input type="text" className="super-input" value={branchForm.gst} onChange={e => setBranchForm({...branchForm, gst: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Manager Name</label>
                  <input type="text" className="super-input" value={branchForm.manager} onChange={e => setBranchForm({...branchForm, manager: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Working Hours</label>
                  <input type="text" className="super-input" value={branchForm.workingHours} onChange={e => setBranchForm({...branchForm, workingHours: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tables Count</label>
                  <input type="number" className="super-input" value={branchForm.tables} onChange={e => setBranchForm({...branchForm, tables: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">KDS Count</label>
                  <input type="number" className="super-input" value={branchForm.kds} onChange={e => setBranchForm({...branchForm, kds: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBranchModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingBranchId ? 'Save Changes' : 'Register Branch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Restaurant Staff Account Modal */}
      {showAddUserModal && (
        <div className="super-modal-overlay">
          <div className="super-modal max-w-sm">
            <div className="super-modal-header">
              <h4>Register Staff Operator</h4>
              <button className="close-btn" onClick={() => setShowAddUserModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" required className="super-input" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input type="text" required className="super-input" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" required className="super-input" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" required className="super-input" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Operational Role</label>
                <select className="super-select" value={userForm.roleName} onChange={e => setUserForm({...userForm, roleName: e.target.value})}>
                  <option value="OWNER">Restaurant Owner</option>
                  <option value="CASHIER">Cashier (POS Counters)</option>
                  <option value="KITCHEN">Kitchen Staff (KDS Screens)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Onboard / Edit Company Member Modal */}
      {showCompanyMemberModal && (
        <div className="super-modal-overlay">
          <div className="super-modal max-w-sm">
            <div className="super-modal-header">
              <h4>{editingCompanyMember ? 'Edit Company Member' : 'Add Company Member'}</h4>
              <button className="close-btn" onClick={() => setShowCompanyMemberModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveCompanyMember} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" required className="super-input" value={companyMemberForm.fullName} onChange={e => setCompanyMemberForm({...companyMemberForm, fullName: e.target.value})} />
              </div>
              {!editingCompanyMember && (
                <div className="form-group">
                  <label className="form-label">Admin Username *</label>
                  <input type="text" required className="super-input" value={companyMemberForm.username} onChange={e => setCompanyMemberForm({...companyMemberForm, username: e.target.value})} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" required className="super-input" value={companyMemberForm.email} onChange={e => setCompanyMemberForm({...companyMemberForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Password {editingCompanyMember ? '(Leave empty to keep current)' : '*'}</label>
                <input type="password" required={!editingCompanyMember} className="super-input" value={companyMemberForm.password} onChange={e => setCompanyMemberForm({...companyMemberForm, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="super-input" value={companyMemberForm.phone} onChange={e => setCompanyMemberForm({...companyMemberForm, phone: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompanyMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCompanyMember ? 'Save Changes' : 'Create Admin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Add/Edit Plan Modal */}
      {showPlanModal && (
        <div className="super-modal-overlay">
          <div className="super-modal max-w-sm">
            <div className="super-modal-header">
              <h4>{editingPlan ? 'Edit Plan Config' : 'Add Subscription Plan'}</h4>
              <button className="close-btn" onClick={() => setShowPlanModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSavePlan} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Plan Name *</label>
                <input type="text" required className="super-input" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Price (₹) *</label>
                <input type="number" required className="super-input" value={planForm.monthlyPrice} onChange={e => setPlanForm({...planForm, monthlyPrice: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Branches Allowed *</label>
                <input type="number" required className="super-input" value={planForm.maxBranches} onChange={e => setPlanForm({...planForm, maxBranches: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Users Allowed *</label>
                <input type="number" required className="super-input" value={planForm.maxUsers} onChange={e => setPlanForm({...planForm, maxUsers: Number(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Tables Allowed *</label>
                <input type="number" required className="super-input" value={planForm.maxTables} onChange={e => setPlanForm({...planForm, maxTables: Number(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
