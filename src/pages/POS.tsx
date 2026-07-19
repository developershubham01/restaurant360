import React, { useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Smartphone,
  CircleDot,
  DollarSign,
  Printer,
  ChevronRight,
  Coffee,
  Loader,
  AlertCircle,
  Receipt,
  CheckCircle,
  FileText,
  Tag,
  X,
  ChevronDown,
  Users,
  User,
  ChefHat,
  History
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './POS.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  category?: string;
}

const mockProducts: any[] = [];

// Generate invoice number: INV-YYYYMMDD-XXXXX
const generateInvoiceNumber = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `INV-${date}-${seq}`;
};

// ─── Sub-component: Professional A4 Invoice ───────────────────────────────────
interface InvoiceProps {
  invoiceRef: React.RefObject<HTMLDivElement | null>;
  invoiceNumber: string;
  cart: CartItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  discount: number;
  grandTotal: number;
  orderType: string;
  selectedTable: string;
  paymentMethod: string;
  customerPhone: string;
  cashierName: string;
  invoiceDate: Date;
  outletSettings: any;
}

function InvoiceDocument({
  invoiceRef,
  invoiceNumber,
  cart,
  subtotal,
  cgst,
  sgst,
  discount,
  grandTotal,
  orderType,
  selectedTable,
  paymentMethod,
  customerPhone,
  cashierName,
  invoiceDate,
  outletSettings,
}: InvoiceProps) {
  const dateStr = invoiceDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const timeStr = invoiceDate.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <div className="invoice-doc" ref={invoiceRef}>
      {/* ── Header ── */}
      <div className="invoice-header">
        <div className="invoice-brand">
          <div className="invoice-logo-mark">R360</div>
          <div>
            <h1 className="invoice-restaurant-name">{outletSettings.name || 'Restaurant Name'}</h1>
            <p className="invoice-restaurant-tagline">Fine Dining & Quick Service</p>
          </div>
        </div>
        <div className="invoice-meta-right">
          <div className="invoice-title-badge">TAX INVOICE</div>
          <div className="invoice-meta-grid">
            <span className="invoice-meta-label">Invoice No.</span>
            <span className="invoice-meta-value">{invoiceNumber}</span>
            <span className="invoice-meta-label">Date</span>
            <span className="invoice-meta-value">{dateStr}</span>
            <span className="invoice-meta-label">Time</span>
            <span className="invoice-meta-value">{timeStr}</span>
            <span className="invoice-meta-label">Cashier</span>
            <span className="invoice-meta-value">{cashierName}</span>
          </div>
        </div>
      </div>

      {/* ── Address + GSTIN Strip ── */}
      <div className="invoice-address-strip">
        <div>
          <p className="invoice-addr-line">{outletSettings.address || 'Restaurant Address'}</p>
          <p className="invoice-addr-line">📞 {outletSettings.phone || 'N/A'} &nbsp;|&nbsp; FSSAI: {outletSettings.fssaiNumber || 'N/A'}</p>
        </div>
        <div className="invoice-gstin-block">
          <span className="invoice-gstin-label">GSTIN</span>
          <span className="invoice-gstin-value">{outletSettings.gstNumber || 'N/A'}</span>
        </div>
      </div>

      {/* ── Order Info ── */}
      <div className="invoice-order-info-strip">
        <div className="invoice-info-chip">
          <span className="invoice-info-label">Order Type</span>
          <span className="invoice-info-value">{orderType}</span>
        </div>
        {orderType === 'Dine-in' && (
          <div className="invoice-info-chip">
            <span className="invoice-info-label">Table</span>
            <span className="invoice-info-value">{selectedTable}</span>
          </div>
        )}
        {customerPhone && (
          <div className="invoice-info-chip">
            <span className="invoice-info-label">Customer</span>
            <span className="invoice-info-value">{customerPhone}</span>
          </div>
        )}
        <div className="invoice-info-chip">
          <span className="invoice-info-label">Payment</span>
          <span className="invoice-info-value">{paymentMethod}</span>
        </div>
      </div>

      {/* ── Items Table ── */}
      <table className="invoice-items-table">
        <thead>
          <tr>
            <th className="col-sr">#</th>
            <th className="col-item">Item Description</th>
            <th className="col-qty">Qty</th>
            <th className="col-rate">Rate (₹)</th>
            <th className="col-taxable">Taxable (₹)</th>
            <th className="col-amount">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <tr key={item.id} className={idx % 2 === 0 ? 'invoice-row-even' : ''}>
              <td className="col-sr">{idx + 1}</td>
              <td className="col-item">
                <div className="invoice-item-name-row">
                  <span className={`invoice-veg-dot ${item.isVeg ? 'veg' : 'nonveg'}`} />
                  <span>{item.name}</span>
                </div>
                {item.category && <span className="invoice-item-cat">{item.category}</span>}
              </td>
              <td className="col-qty">{item.quantity}</td>
              <td className="col-rate">{item.price.toFixed(2)}</td>
              <td className="col-taxable">{(item.price * item.quantity / 1.05).toFixed(2)}</td>
              <td className="col-amount">{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totals Section ── */}
      <div className="invoice-totals-section">
        {/* GST Breakup */}
        <div className="invoice-gst-breakup">
          <div className="invoice-breakup-title">GST Breakup (5% Total)</div>
          <table className="invoice-gst-table">
            <thead>
              <tr>
                <th>Tax Type</th>
                <th>Rate</th>
                <th>Taxable Amt (₹)</th>
                <th>Tax Amt (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CGST</td>
                <td>{outletSettings.cgstRate}%</td>
                <td>{subtotal.toFixed(2)}</td>
                <td>{cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST</td>
                <td>{outletSettings.sgstRate}%</td>
                <td>{subtotal.toFixed(2)}</td>
                <td>{sgst.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="invoice-summary-col">
          <div className="invoice-summary-row">
            <span>Subtotal (excl. GST)</span>
            <span>₹ {subtotal.toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row">
            <span>CGST @ {outletSettings.cgstRate}%</span>
            <span>₹ {cgst.toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row">
            <span>SGST @ {outletSettings.sgstRate}%</span>
            <span>₹ {sgst.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="invoice-summary-row discount-row">
              <span>Discount</span>
              <span>- ₹ {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="invoice-summary-divider" />
          <div className="invoice-summary-row grand-total-row">
            <span>GRAND TOTAL</span>
            <span>₹ {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── Amount in Words ── */}
      <div className="invoice-words-row">
        <strong>Amount in Words: </strong>
        <span>Rupees {numberToWords(Math.round(grandTotal))} Only</span>
      </div>

      {/* ── Footer ── */}
      <div className="invoice-footer">
        <div className="invoice-footer-left">
          <div className="invoice-qr-placeholder">
            <div className="invoice-qr-inner">
              <div className="qr-grid">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`qr-cell ${Math.random() > 0.5 ? 'filled' : ''}`} />
                ))}
              </div>
            </div>
            <p className="invoice-qr-label">Scan to Pay via UPI</p>
          </div>
        </div>
        <div className="invoice-footer-center">
          <p className="invoice-thank-you">Thank You for Dining with Us! 🙏</p>
          <p className="invoice-footer-note">This is a computer-generated invoice and does not require a physical signature.</p>
          <p className="invoice-footer-note">For queries, contact: support@resto360.in | {outletSettings.phone}</p>
        </div>
        <div className="invoice-footer-right">
          <div className="invoice-auth-block">
            <div className="invoice-auth-line" />
            <p>Authorised Signatory</p>
            <p className="invoice-auth-name">{outletSettings.name}</p>
          </div>
        </div>
      </div>

      <div className="invoice-legal-strip">
        Subject to Delhi jurisdiction. E. &amp; O.E. All disputes subject to Delhi courts.
      </div>
    </div>
  );
}

// Simple number-to-words (handles up to crores)
function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  return convert(n);
}

// ─── Main POS Component ──────────────────────────────────────────────────────
export default function POS() {
  const { user, outletId, terminalId, shiftId } = useAuthStore((state) => state);
  const location = useLocation();
  const passedTableId = location.state?.tableId;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Outlet settings (fetched from backend)
  const [outletSettings, setOutletSettings] = useState({
    name: 'Restaurant',
    phone: '',
    address: '',
    fssaiNumber: '',
    gstNumber: '',
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceChargeRate: 0.0,
    packagingCharge: 15,
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery' | 'Pick Up'>('Dine In');
  const [dbTables, setDbTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Due' | 'Other' | 'Part' | 'UPI'>('Cash');
  const [discount, setDiscount] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [skuInput, setSkuInput] = useState('');
  const [invoiceNumber] = useState(() => generateInvoiceNumber());
  const [invoiceDate] = useState(() => new Date());
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; total: number } | null>(null);

  // New States matching screenshot
  const [applyBogo, setApplyBogo] = useState(false);
  const [applySplit, setApplySplit] = useState(false);
  const [isSalesReturn, setIsSalesReturn] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  
  // Dynamic Customer profile, notes, and priority panels
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'customer' | 'group' | 'note' | 'kitchen' | 'kot-history' | null>(null);
  const [kotHistory, setKotHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('resto360_kot_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerLocality, setCustomerLocality] = useState('');
  const [customerExtra, setCustomerExtra] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [orderNote, setOrderNote] = useState('');
  const [kitchenPriority, setKitchenPriority] = useState<'Normal' | 'Express (Fast)' | 'Delayed / Multi-course'>('Normal');
  const [applyLoyalty, setApplyLoyalty] = useState(true);
  const [useVirtualWallet, setUseVirtualWallet] = useState(false);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [isAcSection, setIsAcSection] = useState(true);
  const [hasKdsDisplay, setHasKdsDisplay] = useState(false);

  // Handle table passed from Table Management
  React.useEffect(() => {
    if (passedTableId) {
      setSelectedTable(passedTableId);
      setOrderType('Dine In');
    }
  }, [passedTableId]);

  // Load categories, menu items, tables, and outlet settings from backend
  React.useEffect(() => {
    const fetchMenuAndTables = async () => {
      try {
        setIsLoadingMenu(true);
        const resolvedOutletId = outletId || 1;
        const [itemsRes, catsRes, tablesRes, outletRes] = await Promise.all([
          api.get(`/api/menu-items?outletId=${resolvedOutletId}`),
          api.get(`/api/categories?outletId=${resolvedOutletId}`),
          api.get(`/api/tables`),
          api.get(`/api/outlets/${resolvedOutletId}`),
        ]);

        if (itemsRes.data && itemsRes.data.success) {
          const loadedItems = itemsRes.data.data
            .filter((item: any) => item.active !== false)
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              sku: item.sku,
              price: Number(item.basePrice),
              category: item.category ? item.category.name : 'Uncategorized',
              isVeg: !item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('fish'),
            }));
          setProducts(loadedItems);
        }

        if (catsRes.data && catsRes.data.success) {
          const catNames = catsRes.data.data.map((c: any) => c.name);
          setCategories(['All', ...catNames]);
        }

        if (tablesRes.data && tablesRes.data.success) {
          const loadedTables = tablesRes.data.data;
          setDbTables(loadedTables);
          if (!passedTableId && loadedTables.length > 0) {
            const firstAvail = loadedTables.find((t: any) => t.status === 'Available');
            setSelectedTable(firstAvail ? firstAvail.id : loadedTables[0].id);
          }
        }

        // Load outlet settings (restaurant name, GSTIN, FSSAI, tax rates)
        if (outletRes.data && outletRes.data.success && outletRes.data.data) {
          const o = outletRes.data.data;
          setOutletSettings({
            name: o.name || 'Restaurant',
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
        console.error('Failed to load menu or tables from backend:', err);
        setApiError('Failed to load menu from server. Showing cached menu.');
        setProducts(mockProducts);
        setCategories(['All', 'Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts']);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchMenuAndTables();
  }, [outletId, passedTableId]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVeg = vegFilter === 'ALL' || 
                         (vegFilter === 'VEG' && product.isVeg) || 
                         (vegFilter === 'NON_VEG' && !product.isVeg);
      return matchesCategory && matchesSearch && matchesVeg;
    });
  }, [products, selectedCategory, searchQuery, vegFilter]);

  // Cart operations
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = Math.round(subtotal * (outletSettings.cgstRate / 100) * 100) / 100;
  const sgst = Math.round(subtotal * (outletSettings.sgstRate / 100) * 100) / 100;
  const gstTotal = cgst + sgst;
  const grandTotal = Math.round((subtotal + gstTotal - discount) * 100) / 100;

  const getUserIdFromUsername = (username: string) => {
    if (username === 'admin') return 1;
    if (username === 'owner') return 2;
    if (username === 'cashier1') return 3;
    if (username === 'chef1') return 4;
    return 3;
  };

  const processCheckout = async (options: {
    print: boolean;
    ebill: boolean;
    kotOnly: boolean;
    printKot: boolean;
    hold: boolean;
  }) => {
    if (cart.length === 0) return;

    if (options.hold) {
      const heldOrder = {
        id: Date.now(),
        cart,
        orderType,
        selectedTable,
        customerPhone,
        discount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHeldOrders(prev => [...prev, heldOrder]);
      setCart([]);
      setDiscount(0);
      setCustomerPhone('');
      alert('Order placed on Hold successfully.');
      return;
    }

    if (options.kotOnly) {
      if (!hasKdsDisplay) {
        handlePrintKot();
      } else {
        alert(`KOT generated and sent to kitchen display for Table ${selectedTable || 'N/A'}!`);
      }
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    const mappedOrderType =
      orderType === 'Dine In' ? 'DINE_IN' :
      orderType === 'Pick Up' ? 'TAKEAWAY' : 'DELIVERY';

    const orderItems = cart.map(item => ({
      menuItemId: item.id,
      variantId: null,
      quantity: item.quantity,
      notes: '',
    }));

    const orderPayload = {
      outletId: outletId || 1,
      terminalId: terminalId || 1,
      shiftId: shiftId || 1,
      userId: getUserIdFromUsername(user?.username || ''),
      customerPhone: customerPhone || null,
      couponCode: discount > 0 ? 'WELCOME50' : null,
      orderType: mappedOrderType,
      tableNumber: orderType === 'Dine In' ? selectedTable : null,
      items: orderItems,
    };

    try {
      const createResponse = await api.post('/api/orders', orderPayload);

      if (createResponse.data && createResponse.data.success) {
        const createdOrder = createResponse.data.data;
        const orderId = createdOrder.id;

        if (isPaid) {
          const paymentResponse = await api.post(`/api/orders/${orderId}/pay`, null, {
            params: {
              paymentMethod: paymentMethod.toUpperCase(),
              transactionReference: paymentMethod === 'Cash' ? 'CASH-TXN' : 'TXN-' + Math.floor(Math.random() * 1000000),
            },
          });

          if (!paymentResponse.data || !paymentResponse.data.success) {
            setApiError(paymentResponse.data?.message || 'Payment recording failed.');
            setIsSubmitting(false);
            return;
          }
        }

        setOrderSuccess({ orderNumber: createdOrder.orderNumber, total: grandTotal });

        if (options.print) {
          alert(`Order #${createdOrder.orderNumber} saved and receipt sent to printer.`);
          setCart([]);
          setDiscount(0);
          setCustomerPhone('');
        } else {
          setIsInvoiceOpen(true);
        }

        if (options.printKot) {
          handlePrintKot();
        }
      } else {
        setApiError(createResponse.data?.message || 'Order creation failed.');
      }
    } catch (err: any) {
      console.error('POS Checkout Error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setApiError(err.response.data.message);
      } else {
        setApiError('An error occurred while connecting to the server. Please check the backend service.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkuAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!skuInput.trim()) return;

    const product = products.find(
      (p) => p.sku?.toLowerCase() === skuInput.trim().toLowerCase() || String(p.id) === skuInput.trim()
    );

    if (product) {
      addToCart(product);
      setSkuInput('');
      setApiError(null);
    } else {
      setApiError(`No item matches code/SKU: "${skuInput}"`);
    }
  };

  const handlePrintKot = (customCart?: any[], customTable?: string, customType?: string, customPriority?: string, customNote?: string) => {
    const activeCart = customCart || cart;
    const activeTable = customTable || selectedTable;
    const activeType = customType || orderType;
    const activePriority = customPriority || kitchenPriority;
    const activeNote = customNote || orderNote;

    const kotRows = activeCart.map((item) => `
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
        <span style="font-weight: 800; font-size: 16px; width: 40px;">${item.quantity} x</span>
        <span style="flex: 1; font-weight: 700; font-family: sans-serif;">${item.name}</span>
      </div>
    `).join('');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newKotLog = {
      kotNo: `KOT-${now.getTime().toString().substring(8)}`,
      table: activeTable || 'N/A',
      type: activeType,
      priority: activePriority,
      note: activeNote,
      timestamp: `${dateStr} ${timeStr}`,
      items: activeCart.map((item) => ({ name: item.name, quantity: item.quantity })),
    };

    setKotHistory((prev) => {
      const next = [newKotLog, ...prev];
      localStorage.setItem('resto360_kot_history', JSON.stringify(next));
      return next;
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KOT - Table ${activeTable || 'N/A'}</title>
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
    <div style="font-size: 11px; margin-top: 2px; font-weight: bold;">${outletSettings.name || 'RESTO360'}</div>
  </div>

  <div class="meta-row">
    <span>KOT No: KOT-${now.getTime().toString().substring(8)}</span>
    <span>Table: ${activeTable ? 'Table ' + activeTable : 'Takeaway'}</span>
  </div>
  <div class="meta-row">
    <span>Type: ${activeType}</span>
    <span>Priority: ${activePriority}</span>
  </div>
  <div class="meta-row">
    <span>Date: ${dateStr}</span>
    <span>Time: ${timeStr}</span>
  </div>

  <div class="divider"></div>

  <div class="items-container">
    ${kotRows}
  </div>

  ${activeNote ? `
  <div class="divider" style="border-top: 1px dashed #000;"></div>
  <div style="font-size: 12px; font-weight: bold; margin: 6px 0; font-family: sans-serif;">Instructions: ${activeNote}</div>
  ` : ''}

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

  const handlePrint = () => {
    // Build a standalone HTML page with the invoice content
    const invoiceRows = cart.map((item, idx) => `
      <tr class="${idx % 2 === 0 ? 'even' : ''}">
        <td class="center gray">${idx + 1}</td>
        <td>
          <div class="item-name-row">
            <span class="veg-dot ${item.isVeg ? 'veg' : 'nonveg'}"></span>
            <strong>${item.name}</strong>
          </div>
          ${item.category ? `<span class="item-cat">${item.category}</span>` : ''}
        </td>
        <td class="center">${item.quantity}</td>
        <td class="right">${item.price.toFixed(2)}</td>
        <td class="right">${(item.price * item.quantity / 1.05).toFixed(2)}</td>
        <td class="right bold">${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('');

    const now = invoiceDate;
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }

    /* HEADER */
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start;
      padding: 24px 28px 18px; background: #1a1a2e; color: #fff; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo-mark { width: 48px; height: 48px; background: linear-gradient(135deg,#ea580c,#f97316);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 13px; color: #fff; }
    .rest-name { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .rest-tag  { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px; }
    .meta-right { text-align: right; }
    .tax-badge { display: inline-block; background: rgba(234,88,12,0.2); border: 1px solid rgba(234,88,12,0.5);
      color: #fb923c; font-size: 9px; font-weight: 800; letter-spacing: 2px;
      padding: 3px 9px; border-radius: 20px; margin-bottom: 8px; }
    .meta-grid { display: grid; grid-template-columns: auto auto; gap: 2px 12px; text-align: left; }
    .meta-label { font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; }
    .meta-val   { font-size: 10px; color: rgba(255,255,255,0.9); font-weight: 600; }

    /* ADDRESS STRIP */
    .addr-strip { display: flex; justify-content: space-between; align-items: center;
      padding: 10px 28px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 6px; }
    .addr-line { font-size: 10px; color: #64748b; line-height: 1.6; }
    .gstin-block { text-align: right; }
    .gstin-label { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; }
    .gstin-val   { font-size: 11px; font-weight: 700; color: #1e293b; font-family: 'Courier New', monospace; }

    /* ORDER INFO CHIPS */
    .order-chips { display: flex; gap: 6px; padding: 10px 28px; border-bottom: 2px solid #e2e8f0; flex-wrap: wrap; }
    .chip { padding: 5px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 5px; }
    .chip-label { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
    .chip-val   { font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 1px; display: block; }

    /* ITEMS TABLE */
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #1e293b; color: #fff; }
    thead th { padding: 9px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: rgba(255,255,255,0.8); text-align: left; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr.even { background: #fafafa; }
    tbody td { padding: 9px 10px; color: #1e293b; vertical-align: middle; }
    .center { text-align: center; }
    .right  { text-align: right; }
    .gray   { color: #94a3b8; }
    .bold   { font-weight: 700; }
    .item-name-row { display: flex; align-items: center; gap: 7px; font-weight: 600; }
    .veg-dot { width: 9px; height: 9px; border-radius: 2px; border: 1.5px solid; flex-shrink: 0; display: inline-block; }
    .veg-dot.veg    { border-color: #16a34a; background: rgba(22,163,74,0.12); }
    .veg-dot.nonveg { border-color: #dc2626; background: rgba(220,38,38,0.12); }
    .item-cat { display: block; font-size: 9px; color: #94a3b8; margin-top: 2px; margin-left: 16px; }
    tbody tr:last-child { border-bottom: 2px solid #e2e8f0; }

    /* TOTALS */
    .totals-section { display: grid; grid-template-columns: 1fr 1fr; border-top: 2px solid #e2e8f0; }
    .gst-breakup { padding: 14px 18px; border-right: 1px solid #e2e8f0; background: #f8faff; }
    .breakup-title { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 8px; }
    .gst-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .gst-table th { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase;
      padding: 3px 5px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .gst-table td { padding: 5px 5px; color: #374151; border-bottom: 1px solid #f1f5f9; }

    .summary-col { padding: 14px 20px; display: flex; flex-direction: column; gap: 5px; }
    .sum-row { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
    .sum-row span:last-child { font-weight: 600; color: #374151; }
    .sum-divider { height: 1px; background: #e2e8f0; margin: 3px 0; }
    .grand-row { font-size: 14px; font-weight: 800; color: #1e293b;
      background: linear-gradient(135deg,#fff7ed,#fef3c7); margin: 0 -6px;
      padding: 9px 6px; border-radius: 7px; border: 1.5px solid #fed7aa; }
    .grand-row span:last-child { color: #ea580c; font-size: 16px; font-weight: 900; }
    .discount-row span:last-child { color: #16a34a !important; }

    /* WORDS */
    .words-row { padding: 8px 28px; background: #fffbeb; border-top: 1px solid #fde68a;
      border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #78350f; }

    /* FOOTER */
    .inv-footer { display: grid; grid-template-columns: auto 1fr auto; gap: 20px;
      align-items: center; padding: 16px 28px; }
    .qr-box { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .qr-inner { width: 64px; height: 64px; padding: 5px; border: 2px solid #1e293b; border-radius: 6px; }
    .qr-grid-print { display: grid; grid-template-columns: repeat(5,1fr); gap: 1px; width: 100%; height: 100%; }
    .qr-c { background: transparent; }
    .qr-c.f { background: #1e293b; border-radius: 1px; }
    .qr-label { font-size: 8px; color: #94a3b8; white-space: nowrap; font-weight: 600; }
    .footer-center { text-align: center; }
    .thank-you { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
    .footer-note { font-size: 9px; color: #94a3b8; line-height: 1.6; }
    .auth-block { text-align: center; font-size: 9px; color: #94a3b8; }
    .auth-line { width: 90px; height: 1px; background: #1e293b; margin: 0 auto 3px; }
    .auth-name { font-size: 10px; font-weight: 700; color: #374151; margin-top: 2px; }

    /* LEGAL */
    .legal { background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 7px 28px;
      font-size: 9px; color: #94a3b8; text-align: center; }

    @page { size: A4; margin: 8mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>

<!-- HEADER -->
<div class="inv-header">
  <div class="brand">
    <div class="logo-mark">R360</div>
    <div>
      <div class="rest-name">${outletSettings.name || 'Restaurant'}</div>
      <div class="rest-tag">Fine Dining &amp; Quick Service</div>
    </div>
  </div>
  <div class="meta-right">
    <div class="tax-badge">TAX INVOICE</div>
    <div class="meta-grid">
      <span class="meta-label">Invoice No.</span><span class="meta-val">${invoiceNumber}</span>
      <span class="meta-label">Date</span><span class="meta-val">${dateStr}</span>
      <span class="meta-label">Time</span><span class="meta-val">${timeStr}</span>
      <span class="meta-label">Cashier</span><span class="meta-val">${cashierName}</span>
    </div>
  </div>
</div>

<!-- ADDRESS -->
<div class="addr-strip">
  <div>
    <div class="addr-line">${outletSettings.address || 'Restaurant Address'}</div>
    <div class="addr-line">📞 ${outletSettings.phone || 'N/A'} &nbsp;|&nbsp; FSSAI: ${outletSettings.fssaiNumber || 'N/A'}</div>
  </div>
  <div class="gstin-block">
    <span class="gstin-label">GSTIN</span>
    <span class="gstin-val">${outletSettings.gstNumber || 'N/A'}</span>
  </div>
</div>

<!-- ORDER CHIPS -->
<div class="order-chips">
  <div class="chip"><span class="chip-label">Order Type</span><span class="chip-val">${orderType}</span></div>
  ${orderType === 'Dine In' ? `<div class="chip"><span class="chip-label">Table</span><span class="chip-val">${selectedTable}</span></div>` : ''}
  ${customerPhone ? `<div class="chip"><span class="chip-label">Customer</span><span class="chip-val">${customerPhone}</span></div>` : ''}
  <div class="chip"><span class="chip-label">Payment</span><span class="chip-val">${paymentMethod}</span></div>
</div>

<!-- ITEMS TABLE -->
<table>
  <thead>
    <tr>
      <th style="width:36px;text-align:center">#</th>
      <th>Item Description</th>
      <th style="width:50px;text-align:center">Qty</th>
      <th style="width:90px;text-align:right">Rate (₹)</th>
      <th style="width:100px;text-align:right">Taxable (₹)</th>
      <th style="width:100px;text-align:right">Amount (₹)</th>
    </tr>
  </thead>
  <tbody>
    ${invoiceRows}
  </tbody>
</table>

<!-- TOTALS -->
<div class="totals-section">
  <div class="gst-breakup">
    <div class="breakup-title">GST Breakup (${outletSettings.cgstRate + outletSettings.sgstRate}% Total)</div>
    <table class="gst-table">
      <thead><tr><th>Tax Type</th><th>Rate</th><th>Taxable Amt (₹)</th><th>Tax Amt (₹)</th></tr></thead>
      <tbody>
        <tr><td>CGST</td><td>${outletSettings.cgstRate}%</td><td>${subtotal.toFixed(2)}</td><td>${cgst.toFixed(2)}</td></tr>
        <tr><td>SGST</td><td>${outletSettings.sgstRate}%</td><td>${subtotal.toFixed(2)}</td><td>${sgst.toFixed(2)}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="summary-col">
    <div class="sum-row"><span>Subtotal (excl. GST)</span><span>₹ ${subtotal.toFixed(2)}</span></div>
    <div class="sum-row"><span>CGST @ ${outletSettings.cgstRate}%</span><span>₹ ${cgst.toFixed(2)}</span></div>
    <div class="sum-row"><span>SGST @ ${outletSettings.sgstRate}%</span><span>₹ ${sgst.toFixed(2)}</span></div>
    ${discount > 0 ? `<div class="sum-row discount-row"><span>Discount</span><span>- ₹ ${discount.toFixed(2)}</span></div>` : ''}
    <div class="sum-divider"></div>
    <div class="sum-row grand-row"><span>GRAND TOTAL</span><span>₹ ${grandTotal.toFixed(2)}</span></div>
  </div>
</div>

<!-- AMOUNT IN WORDS -->
<div class="words-row"><strong>Amount in Words: </strong>Rupees ${numberToWords(Math.round(grandTotal))} Only</div>

<!-- FOOTER -->
<div class="inv-footer">
  <div class="qr-box">
    <div class="qr-inner">
      <div class="qr-grid-print">
        ${Array.from({length:25},(_,i)=>`<div class="qr-c${[0,1,5,6,10,12,14,18,19,24,3,8,16,21].includes(i)?' f':''}"></div>`).join('')}
      </div>
    </div>
    <div class="qr-label">Scan to Pay via UPI</div>
  </div>
  <div class="footer-center">
    <div class="thank-you">Thank You for Dining with Us! 🙏</div>
    <div class="footer-note">This is a computer-generated invoice and does not require a physical signature.</div>
    <div class="footer-note">For queries: support@resto360.in | ${outletSettings.phone || 'N/A'}</div>
  </div>
  <div class="auth-block">
    <div class="auth-line"></div>
    <div>Authorised Signatory</div>
    <div class="auth-name">${outletSettings.name || 'Restaurant'}</div>
  </div>
</div>

<!-- LEGAL -->
<div class="legal">Subject to Delhi jurisdiction. E. &amp; O.E. All disputes subject to Delhi courts.</div>

<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 500);
  };
</script>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
  };


  const handleNewOrder = () => {
    clearCart();
    setCustomerPhone('');
    setDiscount(0);
    setIsInvoiceOpen(false);
    setOrderSuccess(null);
  };

  const cashierName = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Cashier';

  return (
    <div className="pos-container animate-fade-in">
      {/* Left panel - Product selection */}
      <div className="pos-left-panel">
        {/* Search & Categories */}
        <div className="pos-header-actions">
          <div className="pos-search-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper pos-search" style={{ flex: 1, maxWidth: '450px' }}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search dishes (e.g. Biryani, Naan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Veg / Non-Veg Filter Toggle */}
            <div className="veg-filter-toggle-container" style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '30px', padding: '3px', gap: '4px' }}>
              <button
                type="button"
                className={`veg-filter-btn ${vegFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setVegFilter('ALL')}
                style={{ border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: vegFilter === 'ALL' ? 'var(--primary)' : 'transparent', color: vegFilter === 'ALL' ? '#fff' : 'var(--text-secondary)' }}
              >
                All
              </button>
              <button
                type="button"
                className={`veg-filter-btn ${vegFilter === 'VEG' ? 'active' : ''}`}
                onClick={() => setVegFilter('VEG')}
                style={{ border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: vegFilter === 'VEG' ? '#22c55e' : 'transparent', color: vegFilter === 'VEG' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span style={{ width: '8px', height: '8px', border: '1.5px solid #16a34a', display: 'inline-block', borderRadius: '2px', background: '#16a34a' }} />
                Veg
              </button>
              <button
                type="button"
                className={`veg-filter-btn ${vegFilter === 'NON_VEG' ? 'active' : ''}`}
                onClick={() => setVegFilter('NON_VEG')}
                style={{ border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: vegFilter === 'NON_VEG' ? '#dc2626' : 'transparent', color: vegFilter === 'NON_VEG' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span style={{ width: '8px', height: '8px', border: '1.5px solid #dc2626', display: 'inline-block', borderRadius: '2px', background: '#dc2626' }} />
                Non-Veg
              </button>
            </div>
          </div>
          <div className="pos-categories-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`pos-category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="pos-products-grid">
          {isLoadingMenu ? (
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
              <Loader className="animate-spin text-orange-500" size={36} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading menu items from backend...</p>
            </div>
          ) : (
            <>
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  className="pos-product-card animate-scale-in"
                  onClick={() => addToCart(product)}
                >
                  <div className="pos-product-top">
                    <span className={`veg-nonveg-badge ${product.isVeg ? 'veg' : 'non-veg'}`}>
                      <CircleDot size={12} />
                    </span>
                    <span className="pos-product-category">{product.category}</span>
                  </div>
                  <h4 className="pos-product-name">{product.name}</h4>
                  <div className="pos-product-bottom">
                    <span className="pos-product-price">₹{product.price}</span>
                    <div className="pos-add-indicator">
                      <Plus size={14} />
                    </div>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="pos-empty-products" style={{ gridColumn: '1 / -1' }}>
                  <Coffee size={48} />
                  <h3>No items found</h3>
                  <p>Try searching for another dish or selecting a different category.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right panel - Cart */}
      <div className="pos-right-panel card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        
        {/* Order type tabs */}
        <div className="pos-cart-order-types" style={{ display: 'flex', width: '100%', background: 'var(--bg-secondary)' }}>
          {(['Dine In', 'Delivery', 'Pick Up'] as const).map((type) => (
            <button
              key={type}
              type="button"
              style={{
                flex: 1,
                padding: '12px 6px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: orderType === type ? 'var(--primary)' : 'var(--bg-sidebar)',
                color: '#ffffff',
                textTransform: 'uppercase',
                borderRight: '1px solid var(--border)',
                outline: 'none'
              }}
              onClick={() => setOrderType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Sub-selector icon row */}
        <div className="pos-cart-subselector" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'table' ? null : 'table')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              borderBottom: activeSubTab === 'table' ? '2px solid var(--primary)' : 'none'
            }}
          >
            <Coffee size={20} style={{ color: activeSubTab === 'table' ? 'var(--primary)' : 'var(--text-secondary)' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>{selectedTable ? `AC${selectedTable}` : 'AC4'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'customer' ? null : 'customer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              borderBottom: activeSubTab === 'customer' ? '2px solid var(--primary)' : 'none'
            }}
          >
            <User size={20} style={{ color: activeSubTab === 'customer' ? 'var(--primary)' : 'var(--text-secondary)' }} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'group' ? null : 'group')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              borderBottom: activeSubTab === 'group' ? '2px solid var(--primary)' : 'none'
            }}
          >
            <Users size={20} style={{ color: activeSubTab === 'group' ? 'var(--primary)' : 'var(--text-secondary)' }} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'note' ? null : 'note')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              borderBottom: activeSubTab === 'note' ? '2px solid var(--primary)' : 'none'
            }}
          >
            <FileText size={20} style={{ color: activeSubTab === 'note' ? 'var(--primary)' : 'var(--text-secondary)' }} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'kitchen' ? null : 'kitchen')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              borderBottom: activeSubTab === 'kitchen' ? '2px solid var(--primary)' : 'none'
            }}
          >
            <ChefHat size={20} style={{ color: activeSubTab === 'kitchen' ? 'var(--primary)' : 'var(--text-secondary)' }} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'kot-history' ? null : 'kot-history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              borderBottom: activeSubTab === 'kot-history' ? '2px solid var(--primary)' : 'none'
            }}
            title="KOT History"
          >
            <History size={20} style={{ color: activeSubTab === 'kot-history' ? 'var(--primary)' : 'var(--text-secondary)' }} />
          </button>

          <button
            type="button"
            onClick={() => setIsAcSection(!isAcSection)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              background: isAcSection ? '#ffb300' : 'var(--bg-sidebar)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s ease'
            }}
          >
            {isAcSection ? 'AC' : 'Non AC'}
          </button>
        </div>

        {/* Dynamic Expanded Selector Panels */}
        {activeSubTab === 'table' && (
          <div className="pos-subtab-panel" style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Select Active Table</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {dbTables.map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTable(t.id);
                    setActiveSubTab(null);
                  }}
                  style={{
                    padding: '6px',
                    background: selectedTable === t.id ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: selectedTable === t.id ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  T{t.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'customer' && (
          <div className="pos-subtab-panel" style={{ padding: '16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Mobile */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '100px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Mobile:</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '100px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Name:</label>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button type="button" onClick={() => alert('Loading customer purchase history...')} title="Customer History" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button type="button" onClick={() => alert('Exempting GST tax...')} title="Tax Exemption" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <Receipt size={18} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button type="button" onClick={() => alert('Customer preferences loaded.')} title="Preferences" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <Tag size={18} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button type="button" onClick={() => alert('Virtual wallet balance: ₹340.00')} title="Virtual Wallet" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <div style={{ background: '#00a3ff', width: '22px', height: '16px', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={10} style={{ color: '#fff' }} />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerPhone('');
                      setCustomerName('');
                      setCustomerAddress('');
                      setCustomerLocality('');
                      setCustomerExtra('');
                    }}
                    title="Clear Customer"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={18} style={{ color: 'var(--primary)' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <label style={{ width: '100px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Add:</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                style={{ flex: 1, padding: '6px 28px 6px 10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
              {customerAddress && (
                <span
                  onClick={() => setCustomerAddress('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#aaa', fontSize: '14px', fontWeight: 'bold' }}
                >
                  ✕
                </span>
              )}
            </div>

            {/* Locality */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '100px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Locality:</label>
              <input
                type="text"
                value={customerLocality}
                onChange={(e) => setCustomerLocality(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Extra Information */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '100px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Extra Info:</label>
              <input
                type="text"
                value={customerExtra}
                onChange={(e) => setCustomerExtra(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        )}

        {activeSubTab === 'group' && (
          <div className="pos-subtab-panel" style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Number of Guests (PAX)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setGuestCount(num);
                    setActiveSubTab(null);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: guestCount === num ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: guestCount === num ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {num} Guests
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'note' && (
          <div className="pos-subtab-panel" style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Special Order Instructions / Kitchen Note</label>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="e.g. Make it extra spicy, no onions, etc."
              style={{ width: '100%', height: '60px', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
            />
          </div>
        )}

        {activeSubTab === 'kitchen' && (
          <div className="pos-subtab-panel" style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Kitchen Priority Level</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {(['Normal', 'Express (Fast)', 'Delayed / Multi-course'] as const).map((level) => (
                <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="radio"
                    name="kitchenPriority"
                    checked={kitchenPriority === level}
                    onChange={() => {
                      setKitchenPriority(level);
                      setActiveSubTab(null);
                    }}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
            
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '8px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={hasKdsDisplay}
                  onChange={(e) => setHasKdsDisplay(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontWeight: 600 }}>Active Kitchen Screen (KDS)</span>
              </label>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '22px', marginTop: '2px' }}>
                If unchecked, clicking KOT will automatically print a physical kitchen receipt slip.
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'kot-history' && (
          <div className="pos-subtab-panel" style={{ padding: '14px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>KOT Print History Log</label>
              {kotHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear KOT print history?')) {
                      setKotHistory([]);
                      localStorage.removeItem('resto360_kot_history');
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {kotHistory.map((kot: any, idx: number) => (
                <div key={idx} style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{kot.kotNo}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{kot.timestamp}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Table: <strong style={{ color: 'var(--text-primary)' }}>{kot.table}</strong> ({kot.type})</span>
                    <span>Priority: <span style={{ color: kot.priority === 'Normal' ? 'var(--text-secondary)' : 'var(--primary)', fontWeight: 'bold' }}>{kot.priority}</span></span>
                  </div>
                  {kot.note && (
                    <div style={{ fontSize: '11px', color: '#ff7700', fontStyle: 'italic' }}>
                      Instructions: {kot.note}
                    </div>
                  )}
                  <div style={{ marginTop: '4px', borderTop: '1px dashed var(--border)', paddingTop: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>ITEMS:</div>
                    {kot.items.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-primary)', paddingLeft: '4px' }}>
                        <span>• {item.name}</span>
                        <span style={{ fontWeight: 700 }}>x {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handlePrintKot(kot.items, kot.table, kot.type, kot.priority, kot.note)}
                      className="btn btn-primary"
                      style={{ fontSize: '10px', padding: '4px 10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Printer size={10} /> Reprint KOT Slip
                    </button>
                  </div>
                </div>
              ))}

              {kotHistory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No kitchen ticket printed yet during this session.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configuration Row */}
        <div className="pos-configs-form-screenshot" style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {orderType === 'Dine In' && (
            <div style={{ width: '90px' }}>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
              >
                {dbTables.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    Table {t.id}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ flex: 2 }}>
            <input
              type="text"
              placeholder="Phone (Loyalty)..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              placeholder="Disc (₹)"
              min="0"
              max={subtotal}
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
              style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Cart Columns Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr', padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
          <div>ITEMS</div>
          <div>CHECK ITEMS</div>
          <div style={{ textAlign: 'center' }}>QTY.</div>
          <div style={{ textAlign: 'right' }}>PRICE</div>
        </div>

        {/* Cart Items List */}
        <div className="pos-cart-items-screenshot" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr', padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'underline', cursor: 'pointer' }}>
                  {item.name}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span className={`veg-nonveg-badge ${item.isVeg ? 'veg' : 'non-veg'}`} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <CircleDot size={8} />
                </span>
                {item.category || 'Standard'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, -1)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  -
                </button>
                <input
                  type="text"
                  readOnly
                  value={item.quantity}
                  style={{ width: '32px', height: '24px', textAlign: 'center', border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 1)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  +
                </button>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{(item.price * item.quantity).toFixed(2)}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{item.price.toFixed(2)}</div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', color: 'var(--text-secondary)', padding: '24px' }}>
              <ShoppingCart size={40} style={{ color: 'var(--border)', marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>Your cart is empty.</p>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>Tap items on the left to add them to this order.</span>
            </div>
          )}
        </div>

        {/* Footer Billing Control Center */}
        <div className="pos-cart-footer-screenshot" style={{ background: 'var(--bg-sidebar)', color: '#fff', padding: '12px', borderTop: '1px solid var(--border)' }}>
          
          {/* Top Row: Bogo, Split, Sales Return, Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setApplyBogo(!applyBogo)}
                style={{
                  background: applyBogo ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: applyBogo ? '#fff' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                Bogo Offer
              </button>
              <button
                type="button"
                onClick={() => setApplySplit(!applySplit)}
                style={{
                  background: applySplit ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: applySplit ? '#fff' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                Split
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', marginLeft: '6px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={isSalesReturn}
                  onChange={(e) => setIsSalesReturn(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Sales Return</span>
              </label>
            </div>

            {/* Total Widget */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'var(--primary)', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={14} style={{ color: '#fff' }} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Total</span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffb300' }}>
                {Math.round(grandTotal)}
              </span>
            </div>
          </div>

          {/* Middle Row: Payment Mode Radio Selectors */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '8px 0', marginBottom: '10px' }}>
            {(['Cash', 'Card', 'Due', 'Other', 'Part'] as const).map((mode) => (
              <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMethod === mode}
                  onChange={() => {
                    setPaymentMethod(mode);
                    if (mode === 'Due') {
                      setIsPaid(false);
                    } else {
                      setIsPaid(true);
                    }
                  }}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>{mode}</span>
              </label>
            ))}
          </div>

          {/* Bottom Checkboxes: It's Paid, Loyalty, Virtual Wallet */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>It's Paid</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={applyLoyalty}
                onChange={(e) => setApplyLoyalty(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>Loyalty</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useVirtualWallet}
                onChange={(e) => setUseVirtualWallet(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ color: '#ffb300', fontWeight: 600 }}>Virtual Wallet</span>
            </label>
          </div>

          {/* Actions: Save, Save & Print, Save & eBill */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
            <button
              type="button"
              onClick={() => processCheckout({ print: false, ebill: false, kotOnly: false, printKot: false, hold: false })}
              style={{ background: '#d91b2c', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', outline: 'none' }}
              disabled={isSubmitting || cart.length === 0}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => processCheckout({ print: true, ebill: false, kotOnly: false, printKot: false, hold: false })}
              style={{ background: '#d91b2c', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', outline: 'none' }}
              disabled={isSubmitting || cart.length === 0}
            >
              Save &amp; Print
            </button>
            <button
              type="button"
              onClick={() => processCheckout({ print: false, ebill: true, kotOnly: false, printKot: false, hold: false })}
              style={{ background: '#d91b2c', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', outline: 'none' }}
              disabled={isSubmitting || cart.length === 0}
            >
              Save &amp; eBill
            </button>
          </div>

          {/* Secondary Actions: KOT, KOT & Print, Hold */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => processCheckout({ print: false, ebill: false, kotOnly: true, printKot: false, hold: false })}
              style={{ background: '#222222', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '10px 4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', outline: 'none' }}
              disabled={cart.length === 0}
            >
              KOT
            </button>
            <button
              type="button"
              onClick={() => processCheckout({ print: false, ebill: false, kotOnly: false, printKot: true, hold: false })}
              style={{ background: '#222222', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '10px 4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', outline: 'none' }}
              disabled={cart.length === 0}
            >
              KOT &amp; Print
            </button>
            <button
              type="button"
              onClick={() => processCheckout({ print: false, ebill: false, kotOnly: false, printKot: false, hold: true })}
              style={{ background: '#555555', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', outline: 'none' }}
              disabled={cart.length === 0}
            >
              Hold
            </button>
          </div>

        </div>
      </div>

      {/* ── Payment Settlement Modal ── */}
      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content payment-modal">
            <div className="modal-header">
              <div>
                <h3>Settle Payment</h3>
                {orderType === 'Dine In' && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Table {selectedTable}</p>}
              </div>
              <button className="btn-ghost modal-close-btn" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {apiError && (
                <div className="api-error-box" style={{ display: 'flex', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Payment Summary */}
              <div className="payment-summary-box">
                <div className="summary-line">
                  <span>Subtotal (excl. GST):</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>CGST ({outletSettings.cgstRate}%):</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>SGST ({outletSettings.sgstRate}%):</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-line discount-line">
                    <span>Discount:</span>
                    <span style={{ color: 'var(--success)' }}>- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="divider" />
                <div className="summary-line grand-total-line">
                  <span>Amount to Pay:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Mode of Payment Selector */}
              <h4 className="payment-method-title">Select Payment Mode</h4>
              <div className="payment-method-grid">
                <button
                  className={`payment-method-card ${paymentMethod === 'Cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('Cash')}
                >
                  <DollarSign size={24} />
                  <span>Cash</span>
                </button>
                <button
                  className={`payment-method-card ${paymentMethod === 'Card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('Card')}
                >
                  <CreditCard size={24} />
                  <span>Card</span>
                </button>
                <button
                  className={`payment-method-card ${paymentMethod === 'UPI' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('UPI')}
                >
                  <Smartphone size={24} />
                  <span>UPI (QR)</span>
                </button>
              </div>

              {/* Mini Receipt Preview */}
              <div className="mini-receipt-preview">
                <div className="mini-receipt-header">
                  <Receipt size={14} />
                  <span>Bill Preview — {cart.length} item{cart.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="mini-receipt-items">
                  {cart.map((item) => (
                    <div key={item.id} className="mini-receipt-item-row">
                      <span className="mini-item-name">{item.name}</span>
                      <span className="mini-item-qty">×{item.quantity}</span>
                      <span className="mini-item-amt">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => processCheckout({ print: false, ebill: false, kotOnly: false, printKot: false, hold: false })} disabled={isSubmitting || cart.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={14} style={{ marginRight: '6px', display: 'inline-block' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Confirm &amp; Generate Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Professional Invoice Modal ── */}
      {isInvoiceOpen && (
        <div className="modal-overlay invoice-overlay">
          <div className="modal-content invoice-modal">
            {/* Success banner */}
            {orderSuccess && (
              <div className="invoice-success-banner">
                <CheckCircle size={20} />
                <span>Order <strong>#{orderSuccess.orderNumber}</strong> settled successfully! Total: ₹{orderSuccess.total.toFixed(2)} via {paymentMethod}</span>
              </div>
            )}

            {/* Invoice actions toolbar */}
            <div className="invoice-toolbar">
              <div className="invoice-toolbar-left">
                <FileText size={20} />
                <span>Tax Invoice — {invoiceNumber}</span>
              </div>
              <div className="invoice-toolbar-right">
                <button className="btn btn-outline invoice-btn" onClick={handlePrint}>
                  <Printer size={16} /> Print Invoice
                </button>
                <button className="btn btn-primary invoice-btn" onClick={handleNewOrder}>
                  <Plus size={16} /> New Order
                </button>
                <button className="btn-ghost modal-close-btn" onClick={() => setIsInvoiceOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable invoice body */}
            <div className="invoice-scroll-area">
              <InvoiceDocument
                invoiceRef={invoiceRef}
                invoiceNumber={invoiceNumber}
                cart={cart}
                subtotal={subtotal}
                cgst={cgst}
                sgst={sgst}
                discount={discount}
                grandTotal={grandTotal}
                orderType={orderType}
                selectedTable={selectedTable}
                paymentMethod={paymentMethod}
                customerPhone={customerPhone}
                cashierName={cashierName}
                invoiceDate={invoiceDate}
                outletSettings={outletSettings}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
