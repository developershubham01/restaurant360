import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './KitchenDisplay.css';

interface KOTItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface KOTOrder {
  id: string;
  dbId: number;
  table: string;
  type: 'Dine-in' | 'Takeaway' | 'Delivery';
  status: 'New' | 'Preparing' | 'Ready';
  timeElapsed: number; // in minutes
  priority: 'Normal' | 'Urgent';
  items: KOTItem[];
}

export default function KitchenDisplay() {
  const { outletId } = useAuthStore((state) => state);
  const [orders, setOrders] = useState<KOTOrder[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Dine-in' | 'Takeaway' | 'Delivery'>('All');
  const [isLoading, setIsLoading] = useState(true);

  const handlePrintKot = (order: KOTOrder) => {
    const kotRows = order.items.map((item) => `
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
        <span style="font-weight: 800; font-size: 16px; width: 40px;">${item.quantity} x</span>
        <span style="flex: 1; font-weight: 700; font-family: sans-serif;">${item.name}</span>
      </div>
      ${item.notes ? `<div style="font-size: 12px; font-style: italic; color: #555; margin-left: 40px; margin-bottom: 8px;">* Note: ${item.notes}</div>` : ''}
    `).join('');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KOT - ${order.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 4mm; color: #000; background: #fff; }
    .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    .title { font-size: 16px; font-weight: 900; letter-spacing: 1px; }
    .meta-row { font-size: 12px; margin-bottom: 3px; display: flex; justify-content: space-between; font-weight: bold; }
    .divider { border-top: 1px solid #000; margin: 8px 0; }
    .items-container { margin: 10px 0; }
    .footer { text-align: center; font-size: 11px; margin-top: 12px; border-top: 1px solid #000; padding-top: 8px; }
    @page { size: 80mm auto; margin: 0; }
    @media print { body { width: 80mm; } }
  </style>
</head>
<body onload="window.print(); window.close();">
  <div class="header">
    <div class="title">KOT (KITCHEN TICKET)</div>
    <div style="font-size: 11px; margin-top: 2px; font-weight: bold;">RESTO360 SaaS</div>
  </div>

  <div class="meta-row">
    <span>KOT No: ${order.id}</span>
    <span>Table: ${order.table}</span>
  </div>
  <div class="meta-row">
    <span>Type: ${order.type}</span>
    <span>Priority: ${order.priority}</span>
  </div>
  <div class="meta-row">
    <span>Date: ${dateStr}</span>
    <span>Time: ${timeStr}</span>
  </div>

  <div class="divider"></div>

  <div class="items-container">
    ${kotRows}
  </div>

  <div class="divider"></div>

  <div class="footer">
    <div>*** KITCHEN COPY ***</div>
    <div style="font-size: 9px; margin-top: 2px;">Thank you for serving!</div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert('Pop-up blocked! Please allow pop-ups to print KOT slips.');
    }
  };

  const fetchKots = async () => {
    try {
      const resolvedOutletId = outletId || 1;
      const res = await api.get(`/api/kitchen/tickets?outletId=${resolvedOutletId}`);
      if (res.data && res.data.success) {
        const mapped: KOTOrder[] = res.data.data.map((kot: any) => ({
          id: kot.ticketNumber,
          dbId: kot.id,
          table: kot.tableName || 'Takeaway',
          type: kot.orderType || 'Dine-in',
          status: kot.status === 'PENDING' ? 'New' : (kot.status === 'PREPARING' ? 'Preparing' : 'Ready'),
          timeElapsed: kot.timeElapsed || 0,
          priority: (kot.timeElapsed || 0) > 15 ? 'Urgent' : 'Normal',
          items: kot.items.map((it: any) => ({
            name: it.name,
            quantity: it.quantity,
            notes: it.notes
          }))
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch KDS tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKots();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchKots, 10000);
    return () => clearInterval(interval);
  }, [outletId]);

  // Change KOT status in database
  const handleStatusTransition = async (order: KOTOrder) => {
    try {
      const nextStatus = order.status === 'New' ? 'PREPARING' : 'READY';
      const res = await api.put(`/api/kitchen/tickets/${order.dbId}/status?status=${nextStatus}`);
      if (res.data && res.data.success) {
        fetchKots();
      }
    } catch (err) {
      console.error('KOT status transition error:', err);
      alert('Failed to transition KOT status. Verify backend connection.');
    }
  };

  const handleServeOrder = async (order: KOTOrder) => {
    try {
      const res = await api.put(`/api/kitchen/tickets/${order.dbId}/status?status=SERVED`);
      if (res.data && res.data.success) {
        fetchKots();
      }
    } catch (err) {
      console.error('KOT serve error:', err);
      alert('Failed to mark KOT ticket as served.');
    }
  };

  // Filter orders
  const displayOrders = orders.filter((order) => {
    return filterType === 'All' || order.type === filterType;
  });

  const newOrders = displayOrders.filter((o) => o.status === 'New');
  const preparingOrders = displayOrders.filter((o) => o.status === 'Preparing');
  const readyOrders = displayOrders.filter((o) => o.status === 'Ready');

  return (
    <div className="kds-container animate-fade-in">
      {/* Header controls */}
      <div className="kds-header">
        <div className="kds-header-left">
          {/* Order Type Filter */}
          <div className="filter-type-group">
            {(['All', 'Dine-in', 'Takeaway', 'Delivery'] as const).map((type) => (
              <button
                key={type}
                className={`filter-btn ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="kds-counters">
            <span className="badge badge-orange">New: {newOrders.length}</span>
            <span className="badge badge-blue">Preparing: {preparingOrders.length}</span>
            <span className="badge badge-green">Ready: {readyOrders.length}</span>
          </div>
        </div>

        <div className="kds-header-right">
          <button 
            className="btn btn-ghost btn-sm flex items-center gap-1 text-slate-400 hover:text-white"
            onClick={fetchKots}
            disabled={isLoading}
            style={{ cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh KOTs</span>
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="kds-kanban-board">
        {/* Column 1: New */}
        <div className="kds-column column-new">
          <div className="column-header">
            <h3>New Orders</h3>
            <span className="column-count">{newOrders.length}</span>
          </div>
          <div className="column-cards-container">
            {newOrders.map((order) => (
              <div key={order.id} className={`kds-order-card ${order.priority === 'Urgent' ? 'priority-urgent' : ''} animate-scale-in`}>
                <div className="card-top">
                  <div className="kot-meta-row">
                    <span className="kot-id">{order.id}</span>
                    <span className={`badge ${
                      order.type === 'Dine-in' ? 'badge-orange' :
                      order.type === 'Takeaway' ? 'badge-blue' : 'badge-gray'
                    }`}>
                      {order.table}
                    </span>
                  </div>
                  <div className="timer-badge">
                    <Clock size={12} />
                    <span>{order.timeElapsed} min</span>
                  </div>
                </div>

                <div className="card-items-section">
                  {order.items.map((item, index) => (
                    <div key={index} className="kot-item-line">
                      <span className="kot-item-qty">{item.quantity}x</span>
                      <div className="kot-item-details">
                        <span className="kot-item-name">{item.name}</span>
                        {item.notes && <span className="kot-item-notes">{item.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handlePrintKot(order)}
                    style={{ cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Print KOT"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStatusTransition(order)}
                    style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    Start Preparing <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
            {newOrders.length === 0 && (
              <div className="column-empty-state">
                <CheckCircle2 size={36} />
                <p>No new orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="kds-column column-preparing">
          <div className="column-header">
            <h3>Preparing</h3>
            <span className="column-count">{preparingOrders.length}</span>
          </div>
          <div className="column-cards-container">
            {preparingOrders.map((order) => {
              const isDelayed = order.timeElapsed > 15;
              return (
                <div key={order.id} className={`kds-order-card ${
                  order.priority === 'Urgent' ? 'priority-urgent' : ''
                } ${isDelayed ? 'delayed-warning' : ''} animate-scale-in`}>
                  <div className="card-top">
                    <div className="kot-meta-row">
                      <span className="kot-id">{order.id}</span>
                      <span className={`badge ${
                        order.type === 'Dine-in' ? 'badge-orange' :
                        order.type === 'Takeaway' ? 'badge-blue' : 'badge-gray'
                      }`}>
                        {order.table}
                      </span>
                    </div>
                    <div className={`timer-badge ${isDelayed ? 'text-red' : ''}`}>
                      {isDelayed ? <AlertTriangle size={12} className="animate-bounce" /> : <Clock size={12} />}
                      <span>{order.timeElapsed} min</span>
                    </div>
                  </div>

                  <div className="card-items-section">
                    {order.items.map((item, index) => (
                      <div key={index} className="kot-item-line">
                        <span className="kot-item-qty">{item.quantity}x</span>
                        <div className="kot-item-details">
                          <span className="kot-item-name">{item.name}</span>
                          {item.notes && <span className="kot-item-notes">{item.notes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handlePrintKot(order)}
                      style={{ cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Print KOT"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleStatusTransition(order)}
                      style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      Mark as Ready <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {preparingOrders.length === 0 && (
              <div className="column-empty-state">
                <CheckCircle2 size={36} />
                <p>Nothing preparing</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="kds-column column-ready">
          <div className="column-header">
            <h3>Ready for Pickup</h3>
            <span className="column-count">{readyOrders.length}</span>
          </div>
          <div className="column-cards-container">
            {readyOrders.map((order) => (
              <div key={order.id} className="kds-order-card card-ready animate-scale-in">
                <div className="card-top">
                  <div className="kot-meta-row">
                    <span className="kot-id">{order.id}</span>
                    <span className="badge badge-green">{order.table}</span>
                  </div>
                  <div className="timer-badge">
                    <Clock size={12} />
                    <span>{order.timeElapsed} min</span>
                  </div>
                </div>

                <div className="card-items-section">
                  {order.items.map((item, index) => (
                    <div key={index} className="kot-item-line line-ready">
                      <span className="kot-item-qty">{item.quantity}x</span>
                      <span className="kot-item-name">{item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handlePrintKot(order)}
                    style={{ cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Print KOT"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleServeOrder(order)}
                    style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    Clear / Served <CheckCircle2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <div className="column-empty-state">
                <CheckCircle2 size={36} />
                <p>No orders ready</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
