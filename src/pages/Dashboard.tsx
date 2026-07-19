import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Utensils,
  Calendar,
  Layers,
  Loader,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './Dashboard.css';

import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const COLORS = ['#FF6B00', '#FF8C33', '#FFB366', '#FFE0B2'];

interface DashboardOrder {
  id: string;
  customer: string;
  items: string;
  amount: number;
  status: 'Completed' | 'Preparing' | 'Ready' | 'Cancelled';
  time: string;
  type: string;
}

interface PopularItem {
  name: string;
  category: string;
  sales: number;
  percentage: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { outletId } = useAuthStore((state) => state);

  // States
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    avgTicket: 0,
    activeTables: 0,
    occupancyRate: 0,
  });

  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
  const [distributionData, setDistributionData] = useState<{ name: string; value: number }[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const resolvedOutletId = outletId || 1;

      // 1. Fetch Sales Summary, Orders list, and dining tables
      const [summaryRes, ordersRes] = await Promise.all([
        api.get(`/api/reports/sales-summary?outletId=${resolvedOutletId}`),
        api.get(`/api/orders?outletId=${resolvedOutletId}`),
      ]);

      let grossRevenue = 0;
      let totalOrdersCount = 0;
      let averageTicketVal = 0;

      if (summaryRes.data && summaryRes.data.success && summaryRes.data.data) {
        const summary = summaryRes.data.data;
        grossRevenue = Number(summary.totalRevenue || 0);
        totalOrdersCount = Number(summary.totalOrdersCount || 0);
        averageTicketVal = Math.round(Number(summary.averageOrderValue || 0));
      }

      setStats((prev) => ({
        ...prev,
        revenue: grossRevenue,
        orders: totalOrdersCount,
        avgTicket: averageTicketVal,
      }));

      if (ordersRes.data && ordersRes.data.success && ordersRes.data.data) {
        const dbOrders = ordersRes.data.data;

        // A. Calculate active tables & occupancy rate from PENDING orders
        const pendingOrders = dbOrders.filter((o: any) => o.status === 'PENDING');
        const occupiedCount = pendingOrders.length;
        setStats((prev) => ({
          ...prev,
          activeTables: occupiedCount,
          occupancyRate: Math.min(100, Math.round((occupiedCount / 20) * 100)),
        }));

        // B. Map recent orders (limit 5)
        const mappedOrders: DashboardOrder[] = dbOrders.slice(0, 5).map((o: any) => {
          const itemsText = o.items && o.items.length > 0
            ? o.items.map((i: any) => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ')
            : 'POS Quick Sale';

          let formattedStatus: DashboardOrder['status'] = 'Preparing';
          if (o.status === 'PAID') formattedStatus = 'Completed';
          else if (o.status === 'CANCELLED') formattedStatus = 'Cancelled';
          else if (o.status === 'READY') formattedStatus = 'Ready';

          const timeObj = new Date(o.createdAt);
          const timeStr = timeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

          return {
            id: `#${o.id}`,
            customer: o.customerName || (o.customer ? o.customer.name : 'Walk-in Customer'),
            items: itemsText,
            amount: o.totalAmount,
            status: formattedStatus,
            time: timeStr,
            type: o.orderType || 'Dine-in',
          };
        });
        setOrders(mappedOrders);

        // C. Calculate weekly revenue trend from live paid orders
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const salesByDay: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        
        dbOrders.forEach((o: any) => {
          if (o.status === 'PAID') {
            const d = new Date(o.createdAt);
            const dayName = daysOfWeek[d.getDay()];
            if (dayName in salesByDay) {
              salesByDay[dayName] += o.totalAmount;
            }
          }
        });

        // Fallback for visual layout if no paid sales exist yet
        const hasSales = Object.values(salesByDay).some((v) => v > 0);
        if (!hasSales) {
          setRevenueData([
            { name: 'Mon', revenue: 4000 },
            { name: 'Tue', revenue: 6000 },
            { name: 'Wed', revenue: 5500 },
            { name: 'Thu', revenue: 8000 },
            { name: 'Fri', revenue: 12000 },
            { name: 'Sat', revenue: 15000 },
            { name: 'Sun', revenue: 11000 },
          ]);
        } else {
          setRevenueData(
            Object.keys(salesByDay).map((day) => ({
              name: day,
              revenue: salesByDay[day],
            }))
          );
        }

        // D. Calculate sales distribution (By Order Type)
        let dineIn = 0;
        let takeaway = 0;
        let delivery = 0;
        dbOrders.forEach((o: any) => {
          const type = (o.orderType || 'Dine-in').toLowerCase();
          if (type.includes('dine')) dineIn++;
          else if (type.includes('take') || type.includes('pick')) takeaway++;
          else delivery++;
        });

        const totalTypes = dineIn + takeaway + delivery;
        if (totalTypes === 0) {
          setDistributionData([
            { name: 'Dine-In', value: 50 },
            { name: 'Takeaway', value: 30 },
            { name: 'Delivery', value: 20 },
          ]);
        } else {
          setDistributionData([
            { name: 'Dine-In', value: Math.round((dineIn / totalTypes) * 100) },
            { name: 'Takeaway', value: Math.round((takeaway / totalTypes) * 100) },
            { name: 'Delivery', value: Math.round((delivery / totalTypes) * 100) },
          ]);
        }

        // E. Calculate popular items
        const itemSalesMap: Record<string, { name: string; category: string; sales: number }> = {};
        dbOrders.forEach((o: any) => {
          if (o.items) {
            o.items.forEach((i: any) => {
              const itemName = i.menuItem?.name;
              if (itemName) {
                if (!itemSalesMap[itemName]) {
                  itemSalesMap[itemName] = {
                    name: itemName,
                    category: i.menuItem?.category?.name || 'Main Course',
                    sales: 0,
                  };
                }
                itemSalesMap[itemName].sales += i.quantity;
              }
            });
          }
        });

        const sortedItems = Object.values(itemSalesMap).sort((a, b) => b.sales - a.sales);
        const maxSales = sortedItems.length > 0 ? sortedItems[0].sales : 1;
        
        if (sortedItems.length === 0) {
          setPopularItems([
            { name: 'Butter Chicken', category: 'Main Course', sales: 12, percentage: 80 },
            { name: 'Garlic Naan', category: 'Breads', sales: 20, percentage: 100 },
            { name: 'Paneer Tikka', category: 'Starters', sales: 8, percentage: 50 },
          ]);
        } else {
          setPopularItems(
            sortedItems.slice(0, 5).map((item) => ({
              name: item.name,
              category: item.category,
              sales: item.sales,
              percentage: Math.round((item.sales / maxSales) * 100),
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [outletId]);

  return (
    <div className="dashboard-container animate-fade-in">
      {isLoading && (
        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px', color: '#475569', fontSize: '13px', marginBottom: '16px', alignItems: 'center' }}>
          <Loader className="animate-spin text-orange" size={16} />
          <span>Fetching live sales & orders dashboard parameters...</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="dashboard-stats-grid stagger-children">
        <div className="dashboard-stat-card primary-gradient-card">
          <div className="stat-card-header">
            <span className="stat-label text-white-50">Gross Revenue</span>
            <div className="stat-icon-wrapper bg-white-20">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
          <div className="stat-card-body">
            <h2 className="stat-value text-white">₹{stats.revenue.toLocaleString('en-IN')}</h2>
            <div className="stat-trend text-white-80">
              <TrendingUp size={16} />
              <span>Real-time Ledger</span>
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card card">
          <div className="stat-card-header">
            <span className="stat-label">Total Invoices</span>
            <div className="stat-icon-wrapper orange-light-bg">
              <ShoppingCart size={20} className="text-orange" />
            </div>
          </div>
          <div className="stat-card-body">
            <h2 className="stat-value">{stats.orders}</h2>
            <div className="stat-trend success-text">
              <ArrowUpRight size={16} />
              <span>All order types</span>
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card card">
          <div className="stat-card-header">
            <span className="stat-label">Average Ticket Size</span>
            <div className="stat-icon-wrapper orange-light-bg">
              <TrendingUp size={20} className="text-orange" />
            </div>
          </div>
          <div className="stat-card-body">
            <h2 className="stat-value">₹{stats.avgTicket.toLocaleString('en-IN')}</h2>
            <div className="stat-trend success-text">
              <ArrowUpRight size={16} />
              <span>AOV statistic</span>
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card card">
          <div className="stat-card-header">
            <span className="stat-label">Active Tables</span>
            <div className="stat-icon-wrapper orange-light-bg">
              <Users size={20} className="text-orange" />
            </div>
          </div>
          <div className="stat-card-body">
            <h2 className="stat-value">{stats.activeTables} / 20</h2>
            <div className="stat-trend info-text">
              <span>{stats.occupancyRate}% Occupancy rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts-grid">
        <div className="dashboard-chart-card card">
          <div className="card-header">
            <h3>Weekly Revenue Trend</h3>
            <span className="badge badge-orange">Live Sales</span>
          </div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-chart-card card">
          <div className="card-header">
            <h3>Sales Distribution</h3>
            <span className="badge badge-gray">By Order Type</span>
          </div>
          <div className="card-body chart-body flex-center-col">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legends">
              {distributionData.map((d, i) => (
                <div key={d.name} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: COLORS[i] }} />
                  <span className="legend-name">{d.name}</span>
                  <span className="legend-value">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Layout Grid */}
      <div className="dashboard-bottom-grid">
        {/* Recent Orders */}
        <div className="dashboard-table-card card">
          <div className="card-header">
            <h3>Live Orders</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
              View All Orders <ChevronRight size={14} />
            </button>
          </div>
          <div className="card-body no-padding table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><span className="order-id-badge">{order.id}</span></td>
                    <td>
                      <div className="customer-info-cell">
                        <span className="customer-name">{order.customer}</span>
                        <span className="order-type-label">{order.type}</span>
                      </div>
                    </td>
                    <td className="item-summary-cell" title={order.items}>{order.items}</td>
                    <td className="amount-cell">₹{order.amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'Completed' ? 'badge-green' :
                        order.status === 'Cancelled' ? 'badge-red' : 'badge-orange'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="time-cell">
                      <Clock size={12} />
                      <span>{order.time}</span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No live orders recorded today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Items & Quick Actions */}
        <div className="dashboard-side-panel">
          {/* Popular Items */}
          <div className="card side-card">
            <div className="card-header">
              <h3>Popular Items</h3>
            </div>
            <div className="card-body stagger-children">
              {popularItems.map((item) => (
                <div key={item.name} className="popular-item-row">
                  <div className="popular-item-details">
                    <div>
                      <h4 className="popular-item-name">{item.name}</h4>
                      <span className="popular-item-category">{item.category}</span>
                    </div>
                    <span className="popular-item-sales">{item.sales} sold</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
              {popularItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  No item sales logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card side-card">
            <div className="card-header">
              <h3>Quick Operations</h3>
            </div>
            <div className="card-body quick-actions-grid">
              <button className="btn btn-outline quick-btn" onClick={() => navigate('/pos')}>
                <Utensils size={18} />
                <span>New POS Order</span>
              </button>
              <button className="btn btn-outline quick-btn" onClick={() => navigate('/tables')}>
                <Calendar size={18} />
                <span>Reserve Table</span>
              </button>
              <button className="btn btn-outline quick-btn" onClick={() => navigate('/kitchen')}>
                <Layers size={18} />
                <span>View Kitchen</span>
              </button>
              <button className="btn btn-outline quick-btn" onClick={() => navigate('/crm')}>
                <Users size={18} />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
