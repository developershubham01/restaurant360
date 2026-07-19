import React, { useState } from 'react';
import {
  Plus,
  Search,
  Grid,
  List,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CircleDot,
  Check,
  X,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './MenuManagement.css';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  variants?: string[];
  description: string;
}

export default function MenuManagement() {
  const { outletId } = useAuthStore((state) => state);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number; id?: number }[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(true);

  const fetchMenuData = async () => {
    try {
      setIsLoading(true);
      const resolvedOutletId = outletId || 1;
      const [itemsRes, catsRes] = await Promise.all([
        api.get(`/api/menu-items?outletId=${resolvedOutletId}`),
        api.get(`/api/categories?outletId=${resolvedOutletId}`),
      ]);

      let dbCats: any[] = [];
      if (catsRes.data && catsRes.data.success) {
        dbCats = catsRes.data.data;
        setDbCategories(dbCats);
      }

      let dbItems: any[] = [];
      if (itemsRes.data && itemsRes.data.success) {
        dbItems = itemsRes.data.data;
        const mappedItems = dbItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: Number(item.basePrice),
          category: item.category ? item.category.name : 'Uncategorized',
          isVeg: !item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('fish'),
          isAvailable: item.active,
          description: item.description || ''
        }));
        setItems(mappedItems);
      }

      const mappedCats = dbCats.map((cat: any) => {
        const count = dbItems.filter((item: any) => item.category?.id === cat.id).length;
        return {
          id: cat.id,
          name: cat.name,
          count: count
        };
      });
      setCategories(mappedCats);

      if (mappedCats.length > 0 && !selectedCategory) {
        setSelectedCategory(mappedCats[0].name);
        setFormCategory(mappedCats[0].name);
      }
    } catch (err) {
      console.error('Failed to load menu management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMenuData();
  }, [outletId]);

  // Filter items
  const displayItems = items.filter((item) => {
    const matchesCategory = item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = filterType === 'All' || (filterType === 'Veg' ? item.isVeg : !item.isVeg);
    return matchesCategory && matchesSearch && matchesVeg;
  });

  // Toggle availability
  const toggleAvailability = async (id: number) => {
    // Local toggle fallback or simple confirmation
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  // Open modal for add/edit
  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormName(item.name);
      setFormPrice(item.price.toString());
      setFormDesc(item.description);
      setFormCategory(item.category);
      setFormIsVeg(item.isVeg);
    } else {
      setEditingItem(null);
      setFormName('');
      setFormPrice('');
      setFormDesc('');
      setFormCategory(selectedCategory || (categories[0]?.name || ''));
      setFormIsVeg(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) return;

    const matchedCat = dbCategories.find(c => c.name === formCategory);
    if (!matchedCat) {
      alert(`Category "${formCategory}" not found in database. Please create it first.`);
      return;
    }

    try {
      setIsLoading(true);
      const resolvedPrice = Number(formPrice);

      if (editingItem) {
        // Use PUT to update instead of delete+recreate to prevent breaking foreign keys on past orders
        const response = await api.put(`/api/menu-items/${editingItem.id}?categoryId=${matchedCat.id}&name=${encodeURIComponent(formName)}&description=${encodeURIComponent(formDesc)}&basePrice=${resolvedPrice}`);
        if (response.data && response.data.success) {
          await fetchMenuData();
          setIsModalOpen(false);
        }
      } else {
        const response = await api.post(`/api/menu-items?categoryId=${matchedCat.id}&name=${encodeURIComponent(formName)}&description=${encodeURIComponent(formDesc)}&basePrice=${resolvedPrice}`);
        if (response.data && response.data.success) {
          await fetchMenuData();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Failed to save menu item:', err);
      alert('Failed to save menu item. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        setIsLoading(true);
        const res = await api.delete(`/api/menu-items/${id}`);
        if (res.data && res.data.success) {
          await fetchMenuData();
        }
      } catch (err) {
        console.error('Failed to delete menu item:', err);
        alert('Failed to delete menu item. Please check backend connection.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddCategory = async () => {
    const name = window.prompt('Enter new category name:');
    if (!name || !name.trim()) return;

    try {
      setIsLoading(true);
      const resolvedOutletId = outletId || 1;
      const response = await api.post(`/api/categories?outletId=${resolvedOutletId}&name=${encodeURIComponent(name.trim())}`);
      if (response.data && response.data.success) {
        await fetchMenuData();
        setSelectedCategory(name.trim());
      }
    } catch (err) {
      console.error('Failed to add category:', err);
      alert('Failed to add category. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="menu-container animate-fade-in">
      {/* Categories Sidebar */}
      <div className="menu-sidebar card">
        <div className="sidebar-header">
          <h3>Categories</h3>
        </div>
        <div className="categories-list">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`category-item-row ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span>{cat.name}</span>
              <span className="category-item-count">{cat.count}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm sidebar-footer-btn" onClick={handleAddCategory}>
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Main Area */}
      <div className="menu-main-panel">
        <div className="menu-main-header">
          <div className="header-left">
            <h2>{selectedCategory}</h2>
            <span className="badge badge-orange">{displayItems.length} Items</span>
          </div>

          <div className="header-right">
            {/* Search */}
            <div className="search-input-wrapper mm-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search within category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div className="filter-type-group">
              {(['All', 'Veg', 'Non-Veg'] as const).map((type) => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'Grid' ? 'active' : ''}`}
                onClick={() => setViewMode('Grid')}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                className={`view-btn ${viewMode === 'List' ? 'active' : ''}`}
                onClick={() => setViewMode('List')}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>

            {/* Add Item Button */}
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>

        {/* Items Layout */}
        {viewMode === 'Grid' ? (
          <div className="menu-items-grid">
            {displayItems.map((item) => (
              <div key={item.id} className="menu-item-card card animate-scale-in">
                <div className="card-image-placeholder">
                  <ImageIcon size={32} />
                  <span className={`veg-nonveg-badge ${item.isVeg ? 'veg' : 'non-veg'}`}>
                    <CircleDot size={12} />
                  </span>
                </div>
                <div className="card-item-body">
                  <div className="card-item-title-row">
                    <h4>{item.name}</h4>
                    <span className="card-item-price">₹{item.price}</span>
                  </div>
                  <p className="card-item-desc">{item.description}</p>
                  {item.variants && (
                    <div className="card-item-variants">
                      {item.variants.map((v) => (
                        <span key={v} className="variant-badge">{v}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card-item-footer">
                  <div className="availability-switch">
                    <span className="availability-label">
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <button
                      className={`toggle ${item.isAvailable ? 'active' : ''}`}
                      onClick={() => toggleAvailability(item.id)}
                    />
                  </div>
                  <div className="card-item-actions">
                    <button className="icon-action-btn edit" onClick={() => handleOpenModal(item)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-action-btn delete" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Mode */
          <div className="menu-items-list-view card animate-fade-in">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Diet</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => (
                  <tr key={item.id} className={!item.isAvailable ? 'row-unavailable' : ''}>
                    <td>
                      <span className="list-item-name">{item.name}</span>
                    </td>
                    <td className="list-item-desc-cell">{item.description}</td>
                    <td className="amount-cell">₹{item.price}</td>
                    <td>
                      <span className={`veg-nonveg-badge ${item.isVeg ? 'veg' : 'non-veg'}`}>
                        <CircleDot size={10} />
                      </span>
                    </td>
                    <td>
                      <div className="availability-switch">
                        <button
                          className={`toggle ${item.isAvailable ? 'active' : ''}`}
                          onClick={() => toggleAvailability(item.id)}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="list-action-btns">
                        <button className="icon-action-btn edit" onClick={() => handleOpenModal(item)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-action-btn delete" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content item-form-modal" onSubmit={handleSave}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Menu Item' : 'Add New Item'}</h3>
              <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body form-body-grid">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Paneer Butter Masala"
                />
              </div>

              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 300"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Dietary Type</label>
                <div className="form-veg-toggle">
                  <button
                    type="button"
                    className={`diet-toggle-btn veg ${formIsVeg ? 'active' : ''}`}
                    onClick={() => setFormIsVeg(true)}
                  >
                    Veg
                  </button>
                  <button
                    type="button"
                    className={`diet-toggle-btn non-veg ${!formIsVeg ? 'active' : ''}`}
                    onClick={() => setFormIsVeg(false)}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              <div className="form-group span-full">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe the dish ingredients, spice level, serving size..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
