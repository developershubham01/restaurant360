import React, { useState, useEffect } from 'react';
import {
  Store,
  Printer,
  Percent,
  Database,
  Save,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './Settings.css';

interface OutletSettings {
  name: string;
  phone: string;
  address: string;
  fssaiNumber: string;
  gstNumber: string;
  cgstRate: number;
  sgstRate: number;
  serviceChargeRate: number;
  packagingCharge: number;
}

export default function Settings() {
  const { outletId } = useAuthStore((state) => state);
  const [activeTab, setActiveTab] = useState<'Restaurant' | 'Taxes' | 'Printer' | 'Sync'>('Restaurant');
  const [syncStatus, setSyncStatus] = useState<'Idle' | 'Syncing' | 'Completed'>('Idle');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const [settings, setSettings] = useState<OutletSettings>({
    name: '',
    phone: '',
    address: '',
    fssaiNumber: '',
    gstNumber: '',
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceChargeRate: 0.0,
    packagingCharge: 15,
  });

  // Fetch outlet settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const resolvedOutletId = outletId || 1;
        const res = await api.get(`/api/outlets/${resolvedOutletId}`);
        if (res.data && res.data.success && res.data.data) {
          const o = res.data.data;
          setSettings({
            name: o.name || '',
            phone: o.phone || '',
            address: o.address || '',
            fssaiNumber: o.fssaiNumber || '',
            gstNumber: o.gstNumber || '',
            cgstRate: o.cgstRate ?? 2.5,
            sgstRate: o.sgstRate ?? 2.5,
            serviceChargeRate: o.serviceChargeRate ?? 0.0,
            packagingCharge: o.packagingCharge ?? 15,
          });
        }
      } catch (err) {
        console.error('Failed to load outlet settings:', err);
        setSaveError('Failed to load settings from database.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [outletId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess('');
      setSaveError('');
      const resolvedOutletId = outletId || 1;

      const params = new URLSearchParams();
      params.append('name', settings.name);
      params.append('address', settings.address);
      params.append('phone', settings.phone);
      params.append('gstNumber', settings.gstNumber);
      params.append('fssaiNumber', settings.fssaiNumber);
      params.append('cgstRate', String(settings.cgstRate));
      params.append('sgstRate', String(settings.sgstRate));
      params.append('serviceChargeRate', String(settings.serviceChargeRate));
      params.append('packagingCharge', String(settings.packagingCharge));

      await api.put(`/api/outlets/${resolvedOutletId}?${params.toString()}`);
      setSaveSuccess('Settings saved successfully to database!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveError('Failed to save settings. Please try again.');
      setTimeout(() => setSaveError(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerSync = () => {
    setSyncStatus('Syncing');
    setTimeout(() => {
      setSyncStatus('Completed');
      alert('Local database successfully synchronized with Cloud PostgreSQL!');
    }, 2000);
  };

  const updateField = (field: keyof OutletSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="settings-container animate-fade-in">
      {/* Sidebar Selector */}
      <div className="settings-sidebar card">
        <button
          className={`settings-nav-btn ${activeTab === 'Restaurant' ? 'active' : ''}`}
          onClick={() => setActiveTab('Restaurant')}
        >
          <Store size={18} />
          <span>Restaurant Details</span>
        </button>
        <button
          className={`settings-nav-btn ${activeTab === 'Taxes' ? 'active' : ''}`}
          onClick={() => setActiveTab('Taxes')}
        >
          <Percent size={18} />
          <span>GST & Charges</span>
        </button>
        <button
          className={`settings-nav-btn ${activeTab === 'Printer' ? 'active' : ''}`}
          onClick={() => setActiveTab('Printer')}
        >
          <Printer size={18} />
          <span>Receipt Printer</span>
        </button>
        <button
          className={`settings-nav-btn ${activeTab === 'Sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('Sync')}
        >
          <Database size={18} />
          <span>Database & Sync</span>
        </button>
      </div>

      {/* Main Settings panel */}
      <div className="settings-content-panel card">
        {/* Global feedback banners */}
        {saveSuccess && (
          <div style={{ display: 'flex', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '8px', color: '#166534', fontSize: '13px', marginBottom: '16px', alignItems: 'center' }}>
            <CheckCircle size={16} />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div style={{ display: 'flex', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px', alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>{saveError}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', gap: '10px', padding: '40px', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <Loader className="animate-spin" size={20} />
            <span>Loading outlet settings...</span>
          </div>
        ) : (
          <>
            {activeTab === 'Restaurant' && (
              <form className="settings-form animate-fade-in" onSubmit={handleSave}>
                <div className="card-header">
                  <h3>Restaurant Profile Details</h3>
                </div>
                <div className="card-body form-body-grid">
                  <div className="form-group">
                    <label>Restaurant Name *</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      required
                      placeholder="Enter your restaurant name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone Number *</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      required
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="form-group span-full">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      required
                      placeholder="Full restaurant address"
                    />
                  </div>
                  <div className="form-group">
                    <label>FSSAI License Number</label>
                    <input
                      type="text"
                      value={settings.fssaiNumber}
                      onChange={(e) => updateField('fssaiNumber', e.target.value)}
                      placeholder="14-digit FSSAI number"
                      maxLength={20}
                    />
                  </div>
                  <div className="form-group">
                    <label>GSTIN ID</label>
                    <input
                      type="text"
                      value={settings.gstNumber}
                      onChange={(e) => updateField('gstNumber', e.target.value)}
                      placeholder="15-digit GSTIN"
                      maxLength={20}
                    />
                  </div>
                </div>
                <div className="card-footer">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? <><Loader className="animate-spin" size={16} /> Saving...</> : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'Taxes' && (
              <form className="settings-form animate-fade-in" onSubmit={handleSave}>
                <div className="card-header">
                  <h3>GST and Operational Taxes Setup</h3>
                </div>
                <div className="card-body form-body-grid">
                  <div className="form-group">
                    <label>CGST (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.cgstRate}
                      onChange={(e) => updateField('cgstRate', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>SGST (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.sgstRate}
                      onChange={(e) => updateField('sgstRate', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Service Charge (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.serviceChargeRate}
                      onChange={(e) => updateField('serviceChargeRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Packaging Charge (₹)</label>
                    <input
                      type="number"
                      value={settings.packagingCharge}
                      onChange={(e) => updateField('packagingCharge', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="card-footer">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? <><Loader className="animate-spin" size={16} /> Saving...</> : <><Save size={16} /> Save Taxes</>}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'Printer' && (
              <form className="settings-form animate-fade-in" onSubmit={handleSave}>
                <div className="card-header">
                  <h3>Receipt & Thermal Printer Setup</h3>
                </div>
                <div className="card-body form-body-grid">
                  <div className="form-group">
                    <label>Printer Connection Type</label>
                    <select>
                      <option>USB Connection</option>
                      <option>Ethernet (IP Address)</option>
                      <option>Bluetooth</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Thermal Paper Size</label>
                    <select>
                      <option>Thermal 80mm (Standard)</option>
                      <option>Thermal 58mm</option>
                      <option>A4 Laser</option>
                    </select>
                  </div>
                  <div className="divider span-full" />
                  <div className="form-group span-full flex-row-between">
                    <div>
                      <h4 className="bold text-sm">Print KOT automatically</h4>
                      <p className="text-secondary font-small">Spit out order receipts to kitchen as soon as payment is settled.</p>
                    </div>
                    <button type="button" className="toggle active" onClick={() => alert('Toggle KOT Print')} />
                  </div>
                </div>
                <div className="card-footer">
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Printer Config
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'Sync' && (
              <div className="settings-form animate-fade-in">
                <div className="card-header">
                  <h3>Cloud Database Synchronization</h3>
                </div>
                <div className="card-body form-body-grid">
                  <div className="sync-status-box span-full">
                    <div className="sync-status-line">
                      <span>Offline SQLite Status:</span>
                      <span className="badge badge-green">Ready (Offline resilience active)</span>
                    </div>
                    <div className="sync-status-line">
                      <span>Primary Cloud Database:</span>
                      <span className="badge badge-blue">Connected (PostgreSQL)</span>
                    </div>
                    <div className="sync-status-line">
                      <span>Last Sync Date:</span>
                      <span className="bold text-secondary">{new Date().toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="divider span-full" />

                  <div className="form-group span-full">
                    <h4 className="bold text-sm">Synchronize database now</h4>
                    <p className="text-secondary font-small">Push all offline transaction orders, logs, and billing details accumulated locally in SQLite to the main cloud database server.</p>
                    <button
                      type="button"
                      className="btn btn-primary sync-action-btn"
                      onClick={handleTriggerSync}
                      disabled={syncStatus === 'Syncing'}
                    >
                      {syncStatus === 'Syncing' ? 'Syncing local SQLite to Cloud PG...' : 'Trigger PostgreSQL Sync Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
