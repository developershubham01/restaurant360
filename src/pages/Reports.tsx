import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  AlertCircle,
  Loader,
  Printer,
  History,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './Reports.css';

interface OrderLogItem {
  id: number;
  orderNumber: string;
  orderType: string;
  tableNumber: string | null;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
}

export default function Reports() {
  const { outletId } = useAuthStore((state) => state);
  const [activeTab, setActiveTab] = useState<'Sales' | 'Tax' | 'PnL' | 'History'>('Sales');
  const [dateRange, setDateRange] = useState('This Month');

  const [salesSummary, setSalesSummary] = useState<{
    totalRevenue: number;
    totalTaxesCollected: number;
    totalDiscounts: number;
    totalOrdersCount: number;
    averageOrderValue: number;
  } | null>(null);

  const [gstReport, setGstReport] = useState<{
    cgstCollected: number;
    sgstCollected: number;
    totalGstCollected: number;
  } | null>(null);

  const [orders, setOrders] = useState<OrderLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReportsData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const targetOutletId = outletId || 1;
      
      // Fetch Live Reports & order history
      const [salesRes, gstRes, ordersRes] = await Promise.all([
        api.get('/api/reports/sales-summary', { params: { outletId: targetOutletId } }),
        api.get('/api/reports/gst-report', { params: { outletId: targetOutletId } }),
        api.get('/api/reports/order-history', { params: { outletId: targetOutletId } })
      ]);

      if (salesRes.data && salesRes.data.success) {
        setSalesSummary(salesRes.data.data);
      }
      if (gstRes.data && gstRes.data.success) {
        setGstReport(gstRes.data.data);
      }
      if (ordersRes.data && ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setErrorMsg('Could not fetch real-time report data. Database connection offline.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [outletId, activeTab]);

  const handleDownload = () => {
    alert(`Downloading ${activeTab} Report (${dateRange}) as PDF / CSV...`);
  };

  // 1. Calculate Daily Sales Chart Data from live orders list
  const getDailySalesData = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesByDay: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    orders.forEach((order) => {
      if (order.status === 'PAID') {
        const d = new Date(order.createdAt);
        const dayName = daysOfWeek[d.getDay()];
        if (dayName in salesByDay) {
          salesByDay[dayName] += order.totalAmount;
        }
      }
    });

    // Fallback if no paid orders exist yet in database
    const hasSales = Object.values(salesByDay).some(v => v > 0);
    if (!hasSales) {
      return [
        { day: 'Mon', sales: 2400, tax: 120 },
        { day: 'Tue', sales: 3200, tax: 160 },
        { day: 'Wed', sales: 2900, tax: 145 },
        { day: 'Thu', sales: 4100, tax: 205 },
        { day: 'Fri', sales: 5600, tax: 280 },
        { day: 'Sat', sales: 7200, tax: 360 },
        { day: 'Sun', sales: 6100, tax: 305 },
      ];
    }

    return Object.keys(salesByDay).map((day) => ({
      day,
      sales: salesByDay[day],
      tax: Math.round(salesByDay[day] * 0.05),
    }));
  };

  // 2. Calculate Monthly Trend Chart Data from live orders list
  const getMonthlyTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesByMonth: Record<string, number> = {};
    months.forEach((m) => { salesByMonth[m] = 0; });

    orders.forEach((order) => {
      if (order.status === 'PAID') {
        const d = new Date(order.createdAt);
        const monthName = months[d.getMonth()];
        salesByMonth[monthName] += order.totalAmount;
      }
    });

    const hasSales = Object.values(salesByMonth).some(v => v > 0);
    if (!hasSales) {
      return [
        { month: 'May', revenue: 14000 },
        { month: 'Jun', revenue: 26000 },
        { month: 'Jul', revenue: 38000 },
      ];
    }

    return months
      .map((month) => ({
        month,
        revenue: salesByMonth[month],
      }))
      .filter((item) => item.revenue > 0);
  };

  // 3. Calculate GST Tax breakdown from live orders list
  const getGstBreakdown = () => {
    const gstByDate: Record<string, { taxable: number; tax: number; total: number }> = {};
    
    orders.forEach((order) => {
      if (order.status === 'PAID') {
        const d = new Date(order.createdAt);
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        if (!gstByDate[dateStr]) {
          gstByDate[dateStr] = { taxable: 0, tax: 0, total: 0 };
        }
        gstByDate[dateStr].taxable += order.subtotal;
        gstByDate[dateStr].tax += order.taxAmount;
        gstByDate[dateStr].total += order.totalAmount;
      }
    });

    const dates = Object.keys(gstByDate);
    if (dates.length === 0) {
      return [];
    }

    return dates.map((date) => ({
      date,
      taxableValue: gstByDate[date].taxable,
      cgst: gstByDate[date].tax / 2,
      sgst: gstByDate[date].tax / 2,
      totalGst: gstByDate[date].tax,
      netAmount: gstByDate[date].total,
    }));
  };

  // 4. Print Duplicate Receipt Copy
  const handleReprintReceipt = (order: OrderLogItem) => {
    const now = new Date(order.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DUPLICATE RECEIPT - ${order.orderNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; width: 80mm; padding: 4mm; color: #000; background: #fff; }
    .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    .title { font-size: 16px; font-weight: bold; }
    .meta-row { font-size: 12px; margin-bottom: 3px; display: flex; justify-content: space-between; font-weight: bold; }
    .divider { border-top: 1px solid #000; margin: 8px 0; }
    .footer { text-align: center; font-size: 11px; margin-top: 12px; border-top: 1px solid #000; padding-top: 8px; }
  </style>
</head>
<body onload="window.print(); window.close();">
  <div class="header">
    <div class="title">DUPLICATE INVOICE</div>
    <div style="font-size: 11px; font-weight: bold;">RESTO360 SaaS</div>
  </div>

  <div class="meta-row">
    <span>Invoice No: ${order.orderNumber}</span>
    <span>Table: ${order.tableNumber ? 'Table ' + order.tableNumber : 'Takeaway'}</span>
  </div>
  <div class="meta-row">
    <span>Type: ${order.orderType}</span>
    <span>Status: ${order.status}</span>
  </div>
  <div class="meta-row">
    <span>Date: ${dateStr}</span>
    <span>Time: ${timeStr}</span>
  </div>
  <div class="meta-row">
    <span>Customer: ${order.customerName}</span>
  </div>

  <div class="divider"></div>

  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold;">
    <span>Subtotal:</span>
    <span>₹${order.subtotal.toFixed(2)}</span>
  </div>
  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold;">
    <span>Discount:</span>
    <span>₹${order.discountAmount.toFixed(2)}</span>
  </div>
  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold;">
    <span>GST Tax (5%):</span>
    <span>₹${order.taxAmount.toFixed(2)}</span>
  </div>
  
  <div class="divider" style="border-top: 2px double #000;"></div>

  <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900;">
    <span>TOTAL PAID:</span>
    <span>₹${order.totalAmount.toFixed(2)}</span>
  </div>

  <div class="divider"></div>

  <div class="footer">
    <div>*** DUPLICATE CUSTOMER COPY ***</div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  // Derive statistics
  const grossSales = salesSummary ? salesSummary.totalRevenue : orders.reduce((sum, o) => o.status === 'PAID' ? sum + o.totalAmount : sum, 0);
  const taxCollected = salesSummary ? salesSummary.totalTaxesCollected : orders.reduce((sum, o) => o.status === 'PAID' ? sum + o.taxAmount : sum, 0);
  const discountsAllowed = salesSummary ? salesSummary.totalDiscounts : orders.reduce((sum, o) => o.status === 'PAID' ? sum + o.discountAmount : sum, 0);
  const totalInvoicesCount = salesSummary ? salesSummary.totalOrdersCount : orders.length;
  const averageTicketValue = totalInvoicesCount > 0 ? (grossSales / totalInvoicesCount) : 0;

  // Derive PnL values dynamically from actual sales
  const cogsVal = Math.round(grossSales * 0.35); // 35% standard COGS
  const salaryVal = Math.round(grossSales * 0.15); // 15% labor
  const operationsVal = Math.round(grossSales * 0.08); // 8% operations
  const wastageVal = Math.round(grossSales * 0.005); // 0.5% waste
  const totalExpenses = cogsVal + salaryVal + operationsVal + wastageVal;
  const netProfit = Math.max(0, grossSales - totalExpenses);
  const netMarginPercent = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;

  return (
    <div className="reports-container animate-fade-in">
      {/* Header filter controls */}
      <div className="reports-header-actions">
        <div className="tabs">
          <span
            className={`tab ${activeTab === 'Sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('Sales')}
          >
            Sales Reports
          </span>
          <span
            className={`tab ${activeTab === 'Tax' ? 'active' : ''}`}
            onClick={() => setActiveTab('Tax')}
          >
            GST & Tax Reports
          </span>
          <span
            className={`tab ${activeTab === 'PnL' ? 'active' : ''}`}
            onClick={() => setActiveTab('PnL')}
          >
            Profit & Loss Statement
          </span>
          <span
            className={`tab ${activeTab === 'History' ? 'active' : ''}`}
            onClick={() => setActiveTab('History')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={14} /> Order Logs
          </span>
        </div>

        <div className="reports-filters">
          <div className="filter-select-wrapper">
            <Calendar size={14} className="filter-icon" />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleDownload}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', gap: '8px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '12px', color: '#92400e', fontSize: '13px', marginBottom: '16px', alignItems: 'center' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading && (
        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', color: '#475569', fontSize: '13px', marginBottom: '16px', alignItems: 'center' }}>
          <Loader className="animate-spin text-orange" size={16} />
          <span>Syncing real-time reports from database...</span>
        </div>
      )}

      {activeTab === 'Sales' && (
        <div className="reports-content stagger-children">
          {/* Stats row */}
          <div className="reports-stats-grid">
            <div className="report-stat-card card">
              <span className="label">Gross Sales</span>
              <h2 className="val text-orange">
                ₹{grossSales.toLocaleString('en-IN')}
              </h2>
              <span className="subtext success-text">↑ 12% vs last month</span>
            </div>
            <div className="report-stat-card card">
              <span className="label">Total Tax Collected</span>
              <h2 className="val">
                ₹{taxCollected.toLocaleString('en-IN')}
              </h2>
              <span className="subtext">GST Tax Ledgers</span>
            </div>
            <div className="report-stat-card card">
              <span className="label">Discounts Allowed</span>
              <h2 className="val text-red">
                ₹{discountsAllowed.toLocaleString('en-IN')}
              </h2>
              <span className="subtext">Deducted from gross</span>
            </div>
            <div className="report-stat-card card">
              <span className="label">Total Invoices</span>
              <h2 className="val">
                {totalInvoicesCount.toLocaleString('en-IN')}
              </h2>
              <span className="subtext">
                Average ticket: ₹{Math.round(averageTicketValue).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="reports-charts-grid">
            <div className="card report-chart-box">
              <div className="card-header">
                <h3>Daily Sales Revenue (Live)</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getDailySalesData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                    <Bar dataKey="sales" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card report-chart-box">
              <div className="card-header">
                <h3>Monthly Trend Line (Live)</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getMonthlyTrendData()} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                    <YAxis stroke="#6B7280" fontSize={11} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Tax' && (
        <div className="reports-content animate-fade-in stagger-children">
          {/* Tax Cards */}
          <div className="reports-stats-grid">
            <div className="report-stat-card card">
              <span className="label">Total CGST (2.5%)</span>
              <h2 className="val">
                ₹{(taxCollected / 2).toLocaleString('en-IN')}
              </h2>
            </div>
            <div className="report-stat-card card">
              <span className="label">Total SGST (2.5%)</span>
              <h2 className="val">
                ₹{(taxCollected / 2).toLocaleString('en-IN')}
              </h2>
            </div>
            <div className="report-stat-card card">
              <span className="label">IGST (5%)</span>
              <h2 className="val">₹0</h2>
            </div>
            <div className="report-stat-card card">
              <span className="label">Total GST Collected</span>
              <h2 className="val text-orange">
                ₹{taxCollected.toLocaleString('en-IN')}
              </h2>
            </div>
          </div>

          {/* GST breakdown table */}
          <div className="card top-selling-box">
            <div className="card-header">
              <h3>Live GST Tax Invoice Breakdown</h3>
            </div>
            <div className="card-body no-padding">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Taxable Value</th>
                    <th>CGST (2.5%)</th>
                    <th>SGST (2.5%)</th>
                    <th>Total GST (5%)</th>
                    <th>Net Invoice Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getGstBreakdown().map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.date}</td>
                      <td className="bold">₹{row.taxableValue.toLocaleString('en-IN')}</td>
                      <td>₹{row.cgst.toLocaleString('en-IN')}</td>
                      <td>₹{row.sgst.toLocaleString('en-IN')}</td>
                      <td className="bold text-orange">₹{row.totalGst.toLocaleString('en-IN')}</td>
                      <td className="bold">₹{row.netAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {getGstBreakdown().length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        No tax invoices recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PnL' && (
        <div className="reports-content animate-fade-in card pnl-statement-box">
          <div className="card-header">
            <h3>Income Statement / Profit & Loss Summary</h3>
            <span className="badge badge-orange">{dateRange}</span>
          </div>
          <div className="card-body pnl-body">
            <div className="pnl-section">
              <h4 className="section-title text-green">1. REVENUE (Inflow)</h4>
              <div className="pnl-row">
                <span>Food & Beverage Sales (Gross)</span>
                <span>₹{grossSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="pnl-row subtotal-row">
                <span>Total Revenue (A)</span>
                <span>₹{grossSales.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pnl-section">
              <h4 className="section-title text-red">2. COST OF GOODS SOLD & EXPENSES (Outflow)</h4>
              <div className="pnl-row">
                <span>Raw Ingredients Purchase (COGS)</span>
                <span>₹{cogsVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="pnl-row">
                <span>Staff Salary / Labor Expenses</span>
                <span>₹{salaryVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="pnl-row">
                <span>Operational (Rent, Power, Utility Bills)</span>
                <span>₹{operationsVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="pnl-row">
                <span>Wastage Cost</span>
                <span>₹{wastageVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="pnl-row subtotal-row">
                <span>Total Expenses (B)</span>
                <span>₹{totalExpenses.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="divider" />

            <div className="pnl-section pnl-net-result">
              <div className="pnl-row final-row">
                <h3>NET PROFIT / INCOME (A - B)</h3>
                <h3 className="net-profit-val text-green">₹{netProfit.toLocaleString('en-IN')}</h3>
              </div>
              <div className="pnl-row final-row-sub">
                <span>Net Margin Percentage</span>
                <span className="bold text-green">{netMarginPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'History' && (
        <div className="reports-content animate-fade-in card top-selling-box">
          <div className="card-header">
            <h3>Original Order History Log</h3>
          </div>
          <div className="card-body no-padding" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Date & Time</th>
                  <th>Order Type</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Subtotal</th>
                  <th>Discounts</th>
                  <th>GST Tax</th>
                  <th>Total Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const dateObj = new Date(order.createdAt);
                  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

                  let statusClass = 'badge-gray';
                  if (order.status === 'PAID') statusClass = 'badge-green';
                  else if (order.status === 'CANCELLED') statusClass = 'badge-red';
                  else if (['PENDING', 'PREPARING', 'READY'].includes(order.status)) statusClass = 'badge-yellow';

                  return (
                    <tr key={order.id}>
                      <td className="bold">{order.orderNumber}</td>
                      <td>{dateStr} {timeStr}</td>
                      <td><span className="badge badge-gray">{order.orderType}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        {order.customerPhone && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{order.customerPhone}</div>}
                      </td>
                      <td className="bold">{order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}</td>
                      <td>₹{order.subtotal.toFixed(2)}</td>
                      <td className="text-red">₹{order.discountAmount.toFixed(2)}</td>
                      <td>₹{order.taxAmount.toFixed(2)}</td>
                      <td className="bold text-orange">₹{order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${statusClass}`}>{order.status}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => handleReprintReceipt(order)}
                          title="Reprint Duplicate Invoice"
                          style={{ color: 'var(--primary)' }}
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                      No orders logged in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
