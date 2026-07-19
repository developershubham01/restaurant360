import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  DollarSign,
  User,
  Trash2,
  X,
  Loader2,
  Settings,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './Inventory.css';

interface StockItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minStockLevel: number;
  sku: string;
}

interface SupplierItem {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

interface WasteItem {
  id: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  reason: string;
  reportedBy: string;
  date: string;
}

interface CategoryItem {
  id: number;
  name: string;
}

export default function Inventory() {
  const { outletId, user } = useAuthStore((state) => state);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Suppliers' | 'Waste'>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [stock, setStock] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Modals visibility states
  const [isAddIngOpen, setIsAddIngOpen] = useState(false);
  const [isAddSupOpen, setIsAddSupOpen] = useState(false);
  const [isAddWasteOpen, setIsAddWasteOpen] = useState(false);
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);

  // Form states - Ingredient
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('');
  const [newIngSku, setNewIngSku] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngMin, setNewIngMin] = useState(10);
  const [newIngStock, setNewIngStock] = useState(0);

  // Form states - Supplier
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  // Form states - Waste
  const [newWasteIngId, setNewWasteIngId] = useState<number | ''>('');
  const [newWasteQty, setNewWasteQty] = useState(1);
  const [newWasteReason, setNewWasteReason] = useState('Spoiled / Overripe');

  // Form states - Custom Category
  const [newCatName, setNewCatName] = useState('');

  const getUserIdFromUsername = (username: string) => {
    if (username === 'admin') return 1;
    if (username === 'owner') return 2;
    if (username === 'cashier1') return 3;
    if (username === 'chef1') return 4;
    return 3;
  };

  const resolvedOutletId = outletId || 1;

  // Fetch all databases logs on load & when tab/outlet changes
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Ingredients
      const ingRes = await api.get(`/api/inventory/ingredients?outletId=${resolvedOutletId}`);
      if (ingRes.data && ingRes.data.success) {
        const mappedStock: StockItem[] = ingRes.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category || 'General',
          currentStock: item.currentStock,
          unit: item.unit,
          minStockLevel: item.minStockLevel,
          sku: item.sku,
        }));
        setStock(mappedStock);
      }

      // 2. Fetch Vendors/Suppliers
      const supRes = await api.get(`/api/inventory/vendors?outletId=${resolvedOutletId}`);
      if (supRes.data && supRes.data.success) {
        const mappedSup: SupplierItem[] = supRes.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          contactName: item.contactName || '',
          phone: item.phone || '',
          email: item.email || '',
          address: item.address || '',
        }));
        setSuppliers(mappedSup);
      }

      // 3. Fetch Wastage
      const wasteRes = await api.get(`/api/inventory/waste?outletId=${resolvedOutletId}`);
      if (wasteRes.data && wasteRes.data.success) {
        const mappedWaste: WasteItem[] = wasteRes.data.data.map((item: any) => {
          const dateObj = new Date(item.createdAt);
          const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          return {
            id: item.id,
            ingredientName: item.ingredient?.name || 'Raw Material',
            quantity: item.quantity,
            unit: item.ingredient?.unit || 'kg',
            reason: item.reason || '',
            reportedBy: item.reportedBy?.fullName || item.reportedBy?.username || 'Staff',
            date: dateStr,
          };
        });
        setWasteLogs(mappedWaste);
      }

      // 4. Fetch Custom Categories
      const catRes = await api.get(`/api/inventory/categories?outletId=${resolvedOutletId}`);
      if (catRes.data && catRes.data.success) {
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0 && !newIngCategory) {
          setNewIngCategory(catRes.data.data[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load inventory details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedOutletId, activeTab]);

  // Handle updates & insertions
  const handleUpdateStock = async (id: number, nextStock: number) => {
    const safeStock = Math.max(0, nextStock);
    try {
      const res = await api.put(`/api/inventory/ingredients/${id}/stock?currentStock=${safeStock}`);
      if (res.data && res.data.success) {
        setStock((prev) =>
          prev.map((item) => (item.id === id ? { ...item, currentStock: safeStock } : item))
        );
      }
    } catch (err) {
      console.error('Error updating stock level:', err);
      alert('Failed to update stock level.');
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName || !newIngSku) return;

    const finalCategory = newIngCategory || (categories.length > 0 ? categories[0].name : 'General');

    try {
      const res = await api.post('/api/inventory/ingredients', null, {
        params: {
          outletId: resolvedOutletId,
          name: newIngName,
          category: finalCategory,
          sku: newIngSku,
          unit: newIngUnit,
          minStockLevel: newIngMin,
          currentStock: newIngStock,
        },
      });

      if (res.data && res.data.success) {
        setIsAddIngOpen(false);
        // Reset form
        setNewIngName('');
        setNewIngSku('');
        setNewIngCategory(categories.length > 0 ? categories[0].name : 'General');
        setNewIngUnit('kg');
        setNewIngMin(10);
        setNewIngStock(0);
        loadData();
      }
    } catch (err: any) {
      console.error('Error adding raw material:', err);
      alert(err.response?.data?.message || 'Failed to add ingredient. Make sure SKU is unique.');
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ingredient? This will delete mapped wastage records.')) return;
    try {
      const res = await api.delete(`/api/inventory/ingredients/${id}`);
      if (res.data && res.data.success) {
        setStock((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      alert('Failed to delete ingredient.');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName) return;

    try {
      const res = await api.post('/api/inventory/vendors', null, {
        params: {
          outletId: resolvedOutletId,
          name: newSupName,
          contactName: newSupContact,
          phone: newSupPhone,
          email: newSupEmail,
          address: newSupAddress,
        },
      });

      if (res.data && res.data.success) {
        setIsAddSupOpen(false);
        setNewSupName('');
        setNewSupContact('');
        setNewSupPhone('');
        setNewSupEmail('');
        setNewSupAddress('');
        loadData();
      }
    } catch (err) {
      console.error('Error adding supplier:', err);
      alert('Failed to add supplier.');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await api.delete(`/api/inventory/vendors/${id}`);
      if (res.data && res.data.success) {
        setSuppliers((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Error deleting supplier:', err);
      alert('Failed to delete supplier.');
    }
  };

  const handleAddWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWasteIngId || newWasteQty <= 0) return;

    const reportedUserId = getUserIdFromUsername(user?.username || '');

    try {
      const res = await api.post('/api/inventory/waste', null, {
        params: {
          outletId: resolvedOutletId,
          ingredientId: newWasteIngId,
          quantity: newWasteQty,
          reason: newWasteReason,
          reportedByUserId: reportedUserId,
        },
      });

      if (res.data && res.data.success) {
        setIsAddWasteOpen(false);
        setNewWasteIngId('');
        setNewWasteQty(1);
        setNewWasteReason('Spoiled / Overripe');
        loadData();
      }
    } catch (err) {
      console.error('Error logging waste entry:', err);
      alert('Failed to log wastage.');
    }
  };

  const handleDeleteWaste = async (id: number) => {
    if (!confirm('Are you sure you want to delete this waste entry? This will NOT restore stock.')) return;
    try {
      const res = await api.delete(`/api/inventory/waste/${id}`);
      if (res.data && res.data.success) {
        setWasteLogs((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Error deleting waste entry:', err);
      alert('Failed to delete waste entry.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      const res = await api.post('/api/inventory/categories', null, {
        params: {
          outletId: resolvedOutletId,
          name: newCatName,
        },
      });

      if (res.data && res.data.success) {
        setNewCatName('');
        // Reload categories list
        const catRes = await api.get(`/api/inventory/categories?outletId=${resolvedOutletId}`);
        if (catRes.data && catRes.data.success) {
          setCategories(catRes.data.data);
          if (catRes.data.data.length > 0 && !newIngCategory) {
            setNewIngCategory(catRes.data.data[0].name);
          }
        }
      }
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? Ingredients belonging to this category will remain unchanged.')) return;
    try {
      const res = await api.delete(`/api/inventory/categories/${id}`);
      if (res.data && res.data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category.');
    }
  };

  // Filter lists
  const filteredStock = stock.filter((item) => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = stock.filter((item) => item.currentStock > 0 && item.currentStock <= item.minStockLevel).length;
  const outOfStockCount = stock.filter((item) => item.currentStock === 0).length;

  return (
    <div className="inventory-container animate-fade-in">
      {/* Top Tabs */}
      <div className="tabs">
        <span
          className={`tab ${activeTab === 'Overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('Overview')}
        >
          Stock Overview
        </span>
        <span
          className={`tab ${activeTab === 'Suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('Suppliers')}
        >
          Suppliers
        </span>
        <span
          className={`tab ${activeTab === 'Waste' ? 'active' : ''}`}
          onClick={() => setActiveTab('Waste')}
        >
          Waste Log
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <Loader2 className="animate-spin text-orange" size={40} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading inventory databases...</span>
        </div>
      ) : (
        <>
          {activeTab === 'Overview' && (
            <div className="stock-overview-section stagger-children">
              {/* Stats widgets */}
              <div className="inventory-stats-row">
                <div className="inventory-stat-card card">
                  <span className="label">Total Stock Items</span>
                  <h2 className="val">{stock.length}</h2>
                </div>
                <div className="inventory-stat-card card low-stock-card">
                  <span className="label text-yellow-dark flex-align-center gap-1">
                    <AlertTriangle size={16} /> Low Stock items
                  </span>
                  <h2 className="val text-yellow-dark">{lowStockCount}</h2>
                </div>
                <div className="inventory-stat-card card out-stock-card">
                  <span className="label text-red flex-align-center gap-1">
                    <AlertTriangle size={16} /> Out of Stock
                  </span>
                  <h2 className="val text-red">{outOfStockCount}</h2>
                </div>
                <div className="inventory-stat-card card">
                  <span className="label">Total Value</span>
                  <h2 className="val text-orange">₹{stock.reduce((acc, curr) => acc + (curr.currentStock * 50), 0).toLocaleString()}</h2>
                </div>
              </div>

              {/* Action Row */}
              <div className="inventory-actions-row">
                <div className="search-input-wrapper inv-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search raw ingredients (e.g. Milk, Onions)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="filter-select-wrapper">
                  <Filter size={14} className="filter-icon" />
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsManageCatOpen(true)}>
                    <Settings size={14} /> Categories
                  </button>
                  <button className="btn btn-primary" onClick={() => setIsAddIngOpen(true)}>
                    <Plus size={14} /> Add Raw Material
                  </button>
                </div>
              </div>

              {/* Grid Layout Table */}
              <div className="inventory-table-container card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Min Level</th>
                      <th>Status</th>
                      <th>Quick Actions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((item) => {
                      const isOut = item.currentStock === 0;
                      const isLow = item.currentStock > 0 && item.currentStock <= item.minStockLevel;
                      const statusText = isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'In Stock');
                      const badgeClass = isOut ? 'badge-red' : (isLow ? 'badge-yellow' : 'badge-green');

                      return (
                        <tr
                          key={item.id}
                          className={`inventory-row ${isOut ? 'row-out' : (isLow ? 'row-low' : '')}`}
                        >
                          <td className="item-name-cell">{item.name}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.sku}</td>
                          <td><span className="badge badge-gray">{item.category}</span></td>
                          <td className="stock-level-cell">
                            <span className="stock-num">{item.currentStock} {item.unit}</span>
                          </td>
                          <td>{item.minStockLevel} {item.unit}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>
                              {statusText}
                            </span>
                          </td>
                          <td>
                            <div className="quick-qty-editor">
                              <button
                                className="qty-btn"
                                onClick={() => handleUpdateStock(item.id, item.currentStock - 5)}
                                title="-5"
                              >
                                -5
                              </button>
                              <button
                                className="qty-btn"
                                onClick={() => handleUpdateStock(item.id, item.currentStock + 5)}
                                title="+5"
                              >
                                +5
                              </button>
                              <button
                                className="qty-btn edit"
                                onClick={() => {
                                  const input = prompt('Enter new stock level:', item.currentStock.toString());
                                  if (input !== null) {
                                    handleUpdateStock(item.id, Number(input));
                                  }
                                }}
                              >
                                Set
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              className="icon-action-btn delete"
                              onClick={() => handleDeleteIngredient(item.id)}
                              title="Delete Ingredient"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStock.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                          No ingredients match the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Suppliers' && (
            <div className="suppliers-tab-content animate-fade-in card">
              <div className="card-header" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Registered Suppliers</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddSupOpen(true)}>
                  <Plus size={12} /> Add Supplier
                </button>
              </div>
              <div className="card-body no-padding">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th>Contact Person</th>
                      <th>Phone Number</th>
                      <th>Email Address</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((sup) => (
                      <tr key={sup.id}>
                        <td className="bold">{sup.name}</td>
                        <td>{sup.contactName}</td>
                        <td>{sup.phone}</td>
                        <td>{sup.email}</td>
                        <td>{sup.address}</td>
                        <td>
                          <button
                            className="icon-action-btn delete"
                            onClick={() => handleDeleteSupplier(sup.id)}
                            title="Delete Supplier"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {suppliers.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                          No suppliers registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Waste' && (
            <div className="waste-tab-content animate-fade-in card">
              <div className="card-header" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Waste Log</h3>
                <button className="btn btn-danger btn-sm" onClick={() => setIsAddWasteOpen(true)}>
                  Log Waste Item
                </button>
              </div>
              <div className="card-body no-padding">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Ingredient</th>
                      <th>Quantity Logged</th>
                      <th>Reason</th>
                      <th>Reported By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.date}</td>
                        <td className="bold">{log.ingredientName}</td>
                        <td className="text-red">-{log.quantity} {log.unit}</td>
                        <td>{log.reason}</td>
                        <td>{log.reportedBy}</td>
                        <td>
                          <button
                            className="icon-action-btn delete"
                            onClick={() => handleDeleteWaste(log.id)}
                            title="Delete Log"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {wasteLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                          No wastage logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- ADD INGREDIENT MODAL --- */}
      {isAddIngOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Add Raw Material</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setIsAddIngOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddIngredient}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Ingredient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Milk, Onions"
                    value={newIngName}
                    onChange={(e) => setNewIngName(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>SKU Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ONN-001"
                      value={newIngSku}
                      onChange={(e) => setNewIngSku(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Category *</label>
                    <select
                      value={newIngCategory}
                      onChange={(e) => setNewIngCategory(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      {categories.length === 0 && <option value="General">General</option>}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Unit of Measure *</label>
                    <select
                      value={newIngUnit}
                      onChange={(e) => setNewIngUnit(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      <option value="kg">KG</option>
                      <option value="Ltr">LTR</option>
                      <option value="pcs">PCS</option>
                      <option value="gms">GMS</option>
                      <option value="mls">MLS</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Min Stock Alert *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newIngMin}
                      onChange={(e) => setNewIngMin(Number(e.target.value))}
                      style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Initial Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={newIngStock}
                    onChange={(e) => setNewIngStock(Number(e.target.value))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddIngOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD SUPPLIER MODAL --- */}
      {isAddSupOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Register New Supplier</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setIsAddSupOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSupplier}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Krishna Dairy Products"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sanjay Sharma"
                    value={newSupContact}
                    onChange={(e) => setNewSupContact(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98123 45678"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. info@krishnadairy.com"
                      value={newSupEmail}
                      onChange={(e) => setNewSupEmail(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Office / Shop Address</label>
                  <textarea
                    placeholder="e.g. Mayur Vihar, New Delhi"
                    value={newSupAddress}
                    onChange={(e) => setNewSupAddress(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '60px', resize: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddSupOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- LOG WASTAGE MODAL --- */}
      {isAddWasteOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Log Waste Entry</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setIsAddWasteOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddWaste}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Select Material *</label>
                  <select
                    required
                    value={newWasteIngId}
                    onChange={(e) => setNewWasteIngId(Number(e.target.value))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Choose Raw Ingredient --</option>
                    {stock.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Current: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Waste Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={newWasteQty}
                    onChange={(e) => setNewWasteQty(Number(e.target.value))}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Reason for Wastage *</label>
                  <select
                    value={newWasteReason}
                    onChange={(e) => setNewWasteReason(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="Spoiled / Overripe">Spoiled / Overripe</option>
                    <option value="Accidental Spillage">Accidental Spillage</option>
                    <option value="Expired Shelf Life">Expired Shelf Life</option>
                    <option value="Incorrect Preparation">Incorrect Preparation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddWasteOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Log Wastage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MANAGE CATEGORIES MODAL --- */}
      {isManageCatOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Manage Material Categories</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setIsManageCatOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>New Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seafood, Beverages"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 16px' }}>
                  Add
                </button>
              </form>

              {/* Categories list */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Existing Categories</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {categories.map((cat) => (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.name}</span>
                      <button
                        type="button"
                        className="icon-action-btn delete"
                        onClick={() => handleDeleteCategory(cat.id)}
                        style={{ padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No custom categories loaded.</span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsManageCatOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
