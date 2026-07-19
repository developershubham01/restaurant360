import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Layers,
  UserCheck,
  Move,
  Users,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Phone,
  User,
  ArrowRightLeft,
  X,
  Link,
  Unlink,
  MapPin,
  Smile
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './TableManagement.css';

interface Table {
  id: string;
  seats: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Billing' | 'Cleaning' | 'OutOfService';
  mergedIntoId?: string | null;
  floorId: number;
  floorName: string;
  activeOrderId?: number | null;
  waiterName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  reservationTime?: string | null;
}

interface Floor {
  id: number;
  name: string;
  active: boolean;
}

export default function TableManagement() {
  const navigate = useNavigate();
  const { outletId } = useAuthStore((state) => state);

  // Core state
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals / Action states
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');

  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableId, setNewTableId] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableFloorId, setNewTableFloorId] = useState<number | null>(null);

  const [showMerge, setShowMerge] = useState(false);
  const [mergeSourceIds, setMergeSourceIds] = useState<string[]>([]);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');

  const [showReserve, setShowReserve] = useState(false);
  const [reserveName, setReserveName] = useState('');
  const [reservePhone, setReservePhone] = useState('');
  const [reserveTime, setReserveTime] = useState('');

  // Fetch floors and tables from backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [floorsRes, tablesRes] = await Promise.all([
        api.get('/api/tables/floors'),
        api.get('/api/tables')
      ]);

      if (floorsRes.data && floorsRes.data.success) {
        const loadedFloors = floorsRes.data.data;
        setFloors(loadedFloors);
        if (loadedFloors.length > 0 && selectedFloorId === null) {
          setSelectedFloorId(loadedFloors[0].id);
        }
      }

      if (tablesRes.data && tablesRes.data.success) {
        setTables(tablesRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load table/floor data:', err);
      setErrorMessage('Failed to load data from backend server. Please verify connections.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selectedTable reference on data refreshes
  useEffect(() => {
    if (selectedTable) {
      const refreshed = tables.find(t => t.id === selectedTable.id);
      setSelectedTable(refreshed || null);
    }
  }, [tables]);

  // Handlers for Floor creation
  const handleAddFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;
    try {
      const res = await api.post(`/api/tables/floors?name=${encodeURIComponent(newFloorName.trim())}`);
      if (res.data && res.data.success) {
        setNewFloorName('');
        setShowAddFloor(false);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create floor section');
    }
  };

  const handleDeleteFloor = async (floorId: number | null) => {
    if (!floorId) return;
    const floor = floors.find((f) => f.id === floorId);
    if (!floor) return;

    if (floors.length <= 1) {
      alert('You must keep at least one floor section.');
      return;
    }

    const confirmMsg = `Are you sure you want to delete the floor section "${floor.name}" and all tables on it? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/api/tables/floors/${floorId}`);
      if (res.data && res.data.success) {
        await fetchData();
      }
    } catch (err: any) {
      console.error('Failed to delete floor:', err);
      alert(err.response?.data?.message || 'Failed to delete floor section.');
    }
  };

  // Handlers for Table creation
  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const floorToAssign = newTableFloorId || selectedFloorId;
    if (!newTableId.trim() || !floorToAssign) return;
    try {
      const res = await api.post(`/api/tables?id=${encodeURIComponent(newTableId.trim())}&seats=${newTableSeats}&floorId=${floorToAssign}`);
      if (res.data && res.data.success) {
        setNewTableId('');
        setShowAddTable(false);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create table');
    }
  };

  // Handle table deletion
  const handleDeleteTable = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete table ${id}?`)) return;
    try {
      const res = await api.delete(`/api/tables/${id}`);
      if (res.data && res.data.success) {
        setSelectedTable(null);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  // Set table status manually
  const handleStatusChange = async (status: Table['status']) => {
    if (!selectedTable) return;
    try {
      const res = await api.put(`/api/tables/${selectedTable.id}/status?status=${status}`);
      if (res.data && res.data.success) {
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Merge tables
  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || mergeSourceIds.length === 0) return;
    try {
      const res = await api.post(`/api/tables/merge?targetTableId=${selectedTable.id}&sourceTableIds=${mergeSourceIds.join(',')}`);
      if (res.data && res.data.success) {
        setShowMerge(false);
        setMergeSourceIds([]);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to merge tables');
    }
  };

  // Split/Unmerge tables
  const handleUnmerge = async () => {
    if (!selectedTable) return;
    try {
      const res = await api.post(`/api/tables/unmerge?parentTableId=${selectedTable.id}`);
      if (res.data && res.data.success) {
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unmerge tables');
    }
  };

  // Transfer table running order
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !transferTargetId) return;
    try {
      const res = await api.post(`/api/tables/transfer?fromTableId=${selectedTable.id}&toTableId=${transferTargetId}`);
      if (res.data && res.data.success) {
        setShowTransfer(false);
        setTransferTargetId('');
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to transfer table');
    }
  };

  // Reserve table
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !reserveName.trim() || !reservePhone.trim() || !reserveTime) return;
    try {
      const formattedTime = new Date(reserveTime).toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
      const res = await api.post(`/api/tables/reserve?tableId=${selectedTable.id}&customerName=${encodeURIComponent(reserveName)}&customerPhone=${encodeURIComponent(reservePhone)}&reservationTime=${formattedTime}`);
      if (res.data && res.data.success) {
        setShowReserve(false);
        setReserveName('');
        setReservePhone('');
        setReserveTime('');
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reserve table');
    }
  };

  // Navigation helper to POS billing page
  const handleGoToPOS = (tableId: string) => {
    navigate('/pos', { state: { tableId } });
  };

  // Filter tables by selected floor/area
  const filteredTables = tables.filter((t) => t.floorId === selectedFloorId);

  // Global layout metrics
  const availableCount = tables.filter((t) => t.status === 'Available').length;
  const occupiedCount = tables.filter((t) => t.status === 'Occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'Reserved').length;
  const billingCount = tables.filter((t) => t.status === 'Billing').length;

  return (
    <div className="table-page-container animate-fade-in">
      {/* Visual Layout Grid */}
      <div className="floor-plan-panel">
        <div className="floor-plan-header">
          {/* Tabs */}
          <div className="floor-tabs-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="floor-tabs">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  className={`floor-tab ${selectedFloorId === floor.id ? 'active' : ''}`}
                  onClick={() => setSelectedFloorId(floor.id)}
                >
                  {floor.name}
                </button>
              ))}
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowAddFloor(true)}
              title="Add Floor Section"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', padding: 0 }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Counts Overview */}
          <div className="status-overview-chips">
            <span className="status-overview-chip available">
              <span className="dot" /> Available ({availableCount})
            </span>
            <span className="status-overview-chip occupied">
              <span className="dot" /> Occupied ({occupiedCount})
            </span>
            <span className="status-overview-chip reserved">
              <span className="dot" /> Reserved ({reservedCount})
            </span>
            <span className="status-overview-chip billing">
              <span className="dot" /> Billing ({billingCount})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedFloorId && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleDeleteFloor(selectedFloorId)}
                style={{ color: 'var(--red)', borderColor: 'var(--red)', height: '34px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
              >
                Delete Section
              </button>
            )}
            <button className="btn btn-primary btn-sm" style={{ height: '34px' }} onClick={() => {
              setNewTableFloorId(selectedFloorId);
              setShowAddTable(true);
            }}>
              <Plus size={14} /> Add Table
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" style={{ margin: '0 var(--space-4)' }}>
            {errorMessage}
          </div>
        )}

        {/* Tables Floor Plan Grid */}
        <div className="tables-grid">
          {filteredTables.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            return (
              <button
                key={table.id}
                className={`table-card status-${table.status.toLowerCase()} ${isSelected ? 'selected' : ''} animate-scale-in`}
                onClick={() => setSelectedTable(table)}
              >
                <div className="table-card-top">
                  <span className="table-card-id">{table.id}</span>
                  <span className="table-card-seats">{table.seats} Pax</span>
                </div>

                <div className="table-card-center">
                  <div className="table-shape-icon">
                    <Grid3X3 size={24} />
                  </div>
                  <span className="table-status-label">
                    {table.status}
                    {table.mergedIntoId && <span style={{ fontSize: '8px', display: 'block', color: 'var(--text-tertiary)' }}>Merged 🔗</span>}
                  </span>
                </div>

                <div className="table-card-bottom">
                  <div className="table-mini-info text-secondary">
                    {table.status === 'Available' && <span>Ready</span>}
                    {table.status === 'Occupied' && <span className="bold text-orange">Dining</span>}
                    {table.status === 'Reserved' && <span className="text-blue">Reserved</span>}
                    {table.status === 'Billing' && <span className="text-red bold">Checkout</span>}
                    {table.status === 'Cleaning' && <span className="text-muted">Cleaning</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Details Side Panel */}
      <div className="table-details-panel card">
        {selectedTable ? (
          <div className="details-content animate-fade-in">
            <div className="details-header">
              <h3>Table {selectedTable.id}</h3>
              <span className={`badge ${
                selectedTable.status === 'Available' ? 'badge-green' :
                selectedTable.status === 'Occupied' ? 'badge-orange' :
                selectedTable.status === 'Billing' ? 'badge-red' :
                selectedTable.status === 'Reserved' ? 'badge-blue' : 'badge-gray'
              }`}>
                {selectedTable.status}
              </span>
            </div>

            <div className="divider" />

            {/* Quick Actions to Go to POS */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c3a 100%)',
                  boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                  border: 'none',
                  height: '42px',
                  fontWeight: 700,
                  fontSize: '14px',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => handleGoToPOS(selectedTable.id)}
              >
                <DollarSign size={16} />
                {selectedTable.status === 'Occupied' || selectedTable.status === 'Billing' ? 'Open Bill / Add Items' : 'Take Order / Open POS'}
              </button>
            </div>

            <div
              className="details-stats-section"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid var(--primary)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div className="details-stat-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <Users size={14} style={{ color: 'var(--text-tertiary)' }} /> Capacity
                </span>
                <span className="val" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTable.seats} Seats</span>
              </div>
              <div className="details-stat-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} /> Area Section
                </span>
                <span className="val" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTable.floorName}</span>
              </div>
              {selectedTable.mergedIntoId && (
                <div className="details-stat-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <Link size={14} style={{ color: 'var(--text-tertiary)' }} /> Merged Into
                  </span>
                  <span className="val bold text-orange" style={{ fontWeight: 700 }}>Table {selectedTable.mergedIntoId}</span>
                </div>
              )}
              {selectedTable.waiterName && (
                <div className="details-stat-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <UserCheck size={14} style={{ color: 'var(--text-tertiary)' }} /> Assigned Waiter
                  </span>
                  <span className="val" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTable.waiterName}</span>
                </div>
              )}
              {selectedTable.customerName && (
                <div className="details-stat-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <Smile size={14} style={{ color: 'var(--text-tertiary)' }} /> Customer Name
                  </span>
                  <span className="val" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTable.customerName}</span>
                </div>
              )}
              {selectedTable.customerPhone && (
                <div className="details-stat-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <Phone size={14} style={{ color: 'var(--text-tertiary)' }} /> Contact Phone
                  </span>
                  <span className="val" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedTable.customerPhone}</span>
                </div>
              )}
              {selectedTable.reservationTime && (
                <div className="details-stat-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <Clock size={14} style={{ color: 'var(--text-tertiary)' }} /> Reservation
                  </span>
                  <span className="val" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {new Date(selectedTable.reservationTime).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="divider" />

            {/* Quick Actions for Selected Table */}
            <div className="details-actions">
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>Update Status</h4>
              <div className="status-setter-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Available')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    border: selectedTable.status === 'Available' ? '1.5px solid #10b981' : '1px solid var(--border)',
                    background: selectedTable.status === 'Available' ? '#10b981' : 'var(--bg-secondary)',
                    color: selectedTable.status === 'Available' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Set Available
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Occupied')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    border: selectedTable.status === 'Occupied' ? '1.5px solid #ff6b00' : '1px solid var(--border)',
                    background: selectedTable.status === 'Occupied' ? '#ff6b00' : 'var(--bg-secondary)',
                    color: selectedTable.status === 'Occupied' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Set Occupied
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Reserved')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    border: selectedTable.status === 'Reserved' ? '1.5px solid #3b82f6' : '1px solid var(--border)',
                    background: selectedTable.status === 'Reserved' ? '#3b82f6' : 'var(--bg-secondary)',
                    color: selectedTable.status === 'Reserved' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Set Reserved
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Billing')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    border: selectedTable.status === 'Billing' ? '1.5px solid #ef4444' : '1px solid var(--border)',
                    background: selectedTable.status === 'Billing' ? '#ef4444' : 'var(--bg-secondary)',
                    color: selectedTable.status === 'Billing' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  Set Billing
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Cleaning')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    border: selectedTable.status === 'Cleaning' ? '1.5px solid #8b5cf6' : '1px solid var(--border)',
                    background: selectedTable.status === 'Cleaning' ? '#8b5cf6' : 'var(--bg-secondary)',
                    color: selectedTable.status === 'Cleaning' ? '#fff' : 'var(--text-secondary)',
                    gridColumn: 'span 2',
                  }}
                >
                  Set Cleaning
                </button>
              </div>

              <div className="divider" />

              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>ERP Operations</h4>
              <div className="ops-buttons">
                <button className="btn btn-secondary ops-btn" onClick={() => setShowTransfer(true)}>
                  <ArrowRightLeft size={16} /> Transfer Table
                </button>
                <button className="btn btn-secondary ops-btn" onClick={() => setShowMerge(true)}>
                  <Users size={16} /> Merge Table
                </button>
                {selectedTable.mergedIntoId && (
                  <button className="btn btn-secondary ops-btn btn-red-light" onClick={handleUnmerge}>
                    <Unlink size={16} /> Split/Unmerge Table
                  </button>
                )}
                {tables.some(t => t.mergedIntoId === selectedTable.id) && (
                  <button className="btn btn-secondary ops-btn btn-red-light" onClick={handleUnmerge}>
                    <Unlink size={16} /> Dissolve Merged Group
                  </button>
                )}
                <button className="btn btn-secondary ops-btn" onClick={() => setShowReserve(true)}>
                  <Calendar size={16} /> Book Reservation
                </button>
                <button className="btn btn-secondary ops-btn btn-red-light" onClick={() => handleDeleteTable(selectedTable.id)}>
                  <Trash2 size={16} /> Delete Table
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="details-empty-state">
            <Layers size={42} />
            <h4>Select a Table</h4>
            <p>Click on any table in the floor plan layout grid to view details and perform quick operations.</p>
          </div>
        )}
      </div>

      {/* ── Add Floor Modal Overlay ── */}
      {showAddFloor && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Create Floor Area Section</h3>
              <button className="modal-close" onClick={() => setShowAddFloor(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddFloorSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Area Section Name</label>
                <input
                  type="text"
                  placeholder="e.g. Poolside Cabana, Rooftop Lounge"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Area</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Table Modal Overlay ── */}
      {showAddTable && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Add Dining Table</h3>
              <button className="modal-close" onClick={() => setShowAddTable(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTableSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Table Number / ID</label>
                <input
                  type="text"
                  placeholder="e.g. T21, VIP-3"
                  value={newTableId}
                  onChange={(e) => setNewTableId(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Seating Capacity (Pax)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Section Area</label>
                <select
                  value={newTableFloorId || ''}
                  onChange={(e) => setNewTableFloorId(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Select Area...</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Table</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Merge Table Modal Overlay ── */}
      {showMerge && selectedTable && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Merge Tables into {selectedTable.id}</h3>
              <button className="modal-close" onClick={() => setShowMerge(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleMergeSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select tables to link/merge with Table <strong>{selectedTable.id}</strong>. Linked tables status will turn to occupied.
              </p>
              <div className="merge-selectors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {tables
                  .filter(t => t.id !== selectedTable.id && !t.mergedIntoId && t.status === 'Available')
                  .map(t => (
                    <label
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={mergeSourceIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMergeSourceIds([...mergeSourceIds, t.id]);
                          } else {
                            setMergeSourceIds(mergeSourceIds.filter(id => id !== t.id));
                          }
                        }}
                      />
                      <span>{t.id}</span>
                    </label>
                  ))}
              </div>
              {tables.filter(t => t.id !== selectedTable.id && !t.mergedIntoId && t.status === 'Available').length === 0 && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center' }}>No other available tables to merge.</p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={mergeSourceIds.length === 0}
              >
                Merge Selected Tables
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Transfer Table Modal Overlay ── */}
      {showTransfer && selectedTable && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Transfer running order from {selectedTable.id}</h3>
              <button className="modal-close" onClick={() => setShowTransfer(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleTransferSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Select Target Table</label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select target table...</option>
                  {tables
                    .filter(t => t.id !== selectedTable.id && t.status === 'Available')
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.id} ({t.seats} Pax) - {t.floorName}</option>
                    ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Transfer Active Session</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Book Reservation Modal Overlay ── */}
      {showReserve && selectedTable && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Book Table {selectedTable.id} Reservation</h3>
              <button className="modal-close" onClick={() => setShowReserve(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleReserveSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Guest Full Name</label>
                <input
                  type="text"
                  placeholder="Mr. Verma / Guest Name"
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Guest Phone Number</label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={reservePhone}
                  onChange={(e) => setReservePhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reservation Time</label>
                <input
                  type="datetime-local"
                  value={reserveTime}
                  onChange={(e) => setReserveTime(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirm Booking</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
