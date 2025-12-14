/**
 * Analytics and Reporting Module
 * Provides advanced statistics for admin dashboard
 */

import { db } from "./client.js";

const ordersCollection = db.collection("orders");
const usersCollection = db.collection("users");
const productsCollection = db.collection("products");
const quotationsCollection = db.collection("quotations");
const samplesCollection = db.collection("samples");

// Helper to parse number safely
const parseNumber = (val, fallback = 0) => {
  const n = parseFloat(val);
  return Number.isNaN(n) ? fallback : n;
};

// Helper to get date range
const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { start: today, end: now };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { start, end: now };
    }
    case "last30days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { start, end: now };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now };
    }
    default:
      return { start: null, end: null };
  }
};

/**
 * Get Dashboard Summary Statistics
 */
export async function getDashboardSummary() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get orders
  const ordersSnapshot = await ordersCollection.get();
  const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Today's orders
  const todayOrders = allOrders.filter(o => {
    const created = new Date(o.createdAt);
    return created >= today;
  });

  // This month's orders
  const thisMonthOrders = allOrders.filter(o => {
    const created = new Date(o.createdAt);
    return created >= thisMonthStart;
  });

  // Last month's orders
  const lastMonthOrders = allOrders.filter(o => {
    const created = new Date(o.createdAt);
    return created >= lastMonthStart && created <= lastMonthEnd;
  });

  // Calculate revenues
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseNumber(o.totals?.total, 0), 0);
  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + parseNumber(o.totals?.total, 0), 0);
  const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + parseNumber(o.totals?.total, 0), 0);
  const totalRevenue = allOrders.reduce((sum, o) => sum + parseNumber(o.totals?.total, 0), 0);

  // Order status counts
  const statusCounts = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  allOrders.forEach(o => {
    const status = (o.status || "pending").toLowerCase();
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
  });

  // Get users count
  const usersSnapshot = await usersCollection.get();
  const totalCustomers = usersSnapshot.size;

  // New customers this month
  const newCustomersThisMonth = usersSnapshot.docs.filter(doc => {
    const data = doc.data();
    const created = data.createdAt ? new Date(data.createdAt) : null;
    return created && created >= thisMonthStart;
  }).length;

  // Get quotes and samples counts
  const quotesSnapshot = await quotationsCollection.get();
  const samplesSnapshot = await samplesCollection.get();

  const pendingQuotes = quotesSnapshot.docs.filter(doc => doc.data().status === "pending").length;
  const pendingSamples = samplesSnapshot.docs.filter(doc => doc.data().status === "pending").length;

  // Calculate growth percentages
  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : 0;

  return {
    // Revenue
    todayRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    totalRevenue,
    revenueGrowth: parseFloat(revenueGrowth),

    // Orders
    todayOrders: todayOrders.length,
    thisMonthOrders: thisMonthOrders.length,
    totalOrders: allOrders.length,
    statusCounts,

    // Customers
    totalCustomers,
    newCustomersThisMonth,

    // Pending items
    pendingOrders: statusCounts.pending,
    pendingQuotes,
    pendingSamples,

    // Averages
    averageOrderValue: allOrders.length > 0 ? totalRevenue / allOrders.length : 0,
  };
}

/**
 * Get Sales Report with detailed breakdown
 */
export async function getSalesReport(filters = {}) {
  const { period, from, to, groupBy = "daily" } = filters;

  let startDate, endDate;

  if (period) {
    const range = getDateRange(period);
    startDate = range.start;
    endDate = range.end;
  } else if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    // Default to last 30 days
    const range = getDateRange("last30days");
    startDate = range.start;
    endDate = range.end;
  }

  // Get orders in date range
  let query = ordersCollection;
  if (startDate) {
    query = query.where("createdAt", ">=", startDate.toISOString());
  }
  if (endDate) {
    query = query.where("createdAt", "<=", endDate.toISOString());
  }

  const ordersSnapshot = await query.get();
  const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Group orders by time period
  const salesByPeriod = new Map();
  const statusByPeriod = new Map();

  orders.forEach(order => {
    const created = new Date(order.createdAt);
    let key;

    switch (groupBy) {
      case "hourly":
        key = `${created.toISOString().slice(0, 13)}:00`;
        break;
      case "daily":
        key = created.toISOString().slice(0, 10);
        break;
      case "weekly": {
        const weekStart = new Date(created);
        weekStart.setDate(created.getDate() - created.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      }
      case "monthly":
        key = created.toISOString().slice(0, 7);
        break;
      default:
        key = created.toISOString().slice(0, 10);
    }

    if (!salesByPeriod.has(key)) {
      salesByPeriod.set(key, { revenue: 0, orders: 0, items: 0 });
    }
    const periodData = salesByPeriod.get(key);
    periodData.revenue += parseNumber(order.totals?.total, 0);
    periodData.orders += 1;
    periodData.items += (order.items || []).reduce((sum, item) => sum + parseNumber(item.quantity, 0), 0);

    // Track status distribution
    const status = (order.status || "pending").toLowerCase();
    if (!statusByPeriod.has(key)) {
      statusByPeriod.set(key, { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
    }
    if (statusByPeriod.get(key)[status] !== undefined) {
      statusByPeriod.get(key)[status]++;
    }
  });

  // Convert to array and sort
  const salesData = Array.from(salesByPeriod.entries())
    .map(([period, data]) => ({
      period,
      ...data,
      statusBreakdown: statusByPeriod.get(period) || {},
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Calculate totals
  const totals = {
    revenue: orders.reduce((sum, o) => sum + parseNumber(o.totals?.total, 0), 0),
    orders: orders.length,
    items: orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + parseNumber(i.quantity, 0), 0), 0),
    averageOrderValue: orders.length > 0
      ? orders.reduce((sum, o) => sum + parseNumber(o.totals?.total, 0), 0) / orders.length
      : 0,
  };

  return {
    salesData,
    totals,
    period: { from: startDate?.toISOString(), to: endDate?.toISOString() },
    groupBy,
  };
}

/**
 * Get Customer Analytics
 */
export async function getCustomerAnalytics(filters = {}) {
  const { period } = filters;
  const range = period ? getDateRange(period) : getDateRange("last30days");

  // Get all users
  const usersSnapshot = await usersCollection.get();
  const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Get all orders
  const ordersSnapshot = await ordersCollection.get();
  const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filter orders by date range
  const filteredOrders = range.start
    ? allOrders.filter(o => {
        const created = new Date(o.createdAt);
        return created >= range.start && (!range.end || created <= range.end);
      })
    : allOrders;

  // Customer order frequency
  const customerOrders = new Map();
  filteredOrders.forEach(order => {
    const customerId = order.customer?.id || order.userId;
    if (customerId) {
      if (!customerOrders.has(customerId)) {
        customerOrders.set(customerId, { orders: 0, revenue: 0, lastOrder: null });
      }
      const data = customerOrders.get(customerId);
      data.orders += 1;
      data.revenue += parseNumber(order.totals?.total, 0);
      const orderDate = new Date(order.createdAt);
      if (!data.lastOrder || orderDate > new Date(data.lastOrder)) {
        data.lastOrder = order.createdAt;
      }
    }
  });

  // Segment customers
  const segments = {
    new: 0,        // 1 order
    returning: 0,  // 2-3 orders
    loyal: 0,      // 4+ orders
    dormant: 0,    // No orders in period but has history
  };

  const topCustomers = [];

  customerOrders.forEach((data, customerId) => {
    const user = allUsers.find(u => u.id === customerId);

    if (data.orders === 1) segments.new++;
    else if (data.orders <= 3) segments.returning++;
    else segments.loyal++;

    topCustomers.push({
      id: customerId,
      name: user?.displayName || user?.name || "Misafir",
      email: user?.email || "N/A",
      orders: data.orders,
      revenue: data.revenue,
      lastOrder: data.lastOrder,
    });
  });

  // Sort top customers by revenue
  topCustomers.sort((a, b) => b.revenue - a.revenue);

  // New customers in period
  const newCustomers = range.start
    ? allUsers.filter(u => {
        const created = u.createdAt ? new Date(u.createdAt) : null;
        return created && created >= range.start && (!range.end || created <= range.end);
      }).length
    : 0;

  // Customer lifetime value
  const totalCustomerRevenue = Array.from(customerOrders.values()).reduce((sum, c) => sum + c.revenue, 0);
  const averageCustomerValue = customerOrders.size > 0 ? totalCustomerRevenue / customerOrders.size : 0;

  return {
    totalCustomers: allUsers.length,
    activeCustomers: customerOrders.size,
    newCustomers,
    segments,
    topCustomers: topCustomers.slice(0, 10),
    averageCustomerValue,
    averageOrdersPerCustomer: customerOrders.size > 0
      ? filteredOrders.length / customerOrders.size
      : 0,
  };
}

/**
 * Get Product Performance Analytics
 */
export async function getProductAnalytics(filters = {}) {
  const { period, limit = 20 } = filters;
  const range = period ? getDateRange(period) : getDateRange("last30days");

  // Get all products
  const productsSnapshot = await productsCollection.get();
  const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Get orders in date range
  const ordersSnapshot = await ordersCollection.get();
  const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const filteredOrders = range.start
    ? allOrders.filter(o => {
        const created = new Date(o.createdAt);
        return created >= range.start && (!range.end || created <= range.end);
      })
    : allOrders;

  // Aggregate product sales
  const productSales = new Map();

  filteredOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const productId = item.id || item.productId;
      if (!productId) return;

      if (!productSales.has(productId)) {
        productSales.set(productId, {
          quantity: 0,
          revenue: 0,
          orders: 0,
        });
      }

      const data = productSales.get(productId);
      data.quantity += parseNumber(item.quantity, 0);
      data.revenue += parseNumber(item.subtotal, parseNumber(item.price, 0) * parseNumber(item.quantity, 0));
      data.orders += 1;
    });
  });

  // Build product performance list
  const productPerformance = [];

  productSales.forEach((sales, productId) => {
    const product = allProducts.find(p => p.id === productId);
    productPerformance.push({
      id: productId,
      name: product?.title || product?.name || "Bilinmeyen Ürün",
      sku: product?.sku || "",
      category: product?.category || "Diğer",
      quantitySold: sales.quantity,
      revenue: sales.revenue,
      orderCount: sales.orders,
      currentStock: parseNumber(product?.stock, 0),
      stockStatus: getStockStatus(parseNumber(product?.stock, 0)),
    });
  });

  // Sort by revenue (top sellers)
  const topSellers = [...productPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  // Sort by quantity (most popular)
  const mostPopular = [...productPerformance]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);

  // Low stock products
  const lowStock = allProducts
    .filter(p => {
      const stock = parseNumber(p.stock, 0);
      return stock > 0 && stock <= 10;
    })
    .map(p => ({
      id: p.id,
      name: p.title || p.name,
      sku: p.sku || "",
      stock: parseNumber(p.stock, 0),
      category: p.category || "Diğer",
    }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 20);

  // Out of stock products
  const outOfStock = allProducts
    .filter(p => parseNumber(p.stock, 0) === 0)
    .map(p => ({
      id: p.id,
      name: p.title || p.name,
      sku: p.sku || "",
      category: p.category || "Diğer",
    }));

  // Category breakdown
  const categoryPerformance = new Map();
  productPerformance.forEach(p => {
    const category = p.category || "Diğer";
    if (!categoryPerformance.has(category)) {
      categoryPerformance.set(category, { revenue: 0, quantity: 0, products: 0 });
    }
    const data = categoryPerformance.get(category);
    data.revenue += p.revenue;
    data.quantity += p.quantitySold;
    data.products += 1;
  });

  const categoryBreakdown = Array.from(categoryPerformance.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    topSellers,
    mostPopular,
    lowStock,
    outOfStock,
    categoryBreakdown,
    totalProducts: allProducts.length,
    totalSoldQuantity: productPerformance.reduce((sum, p) => sum + p.quantitySold, 0),
    totalRevenue: productPerformance.reduce((sum, p) => sum + p.revenue, 0),
  };
}

function getStockStatus(stock) {
  if (stock === 0) return "out_of_stock";
  if (stock <= 5) return "critical";
  if (stock <= 10) return "low";
  return "in_stock";
}

/**
 * Export data to CSV format
 */
export async function exportToCSV(type, filters = {}) {
  let data = [];
  let headers = [];

  switch (type) {
    case "orders": {
      const ordersSnapshot = await ordersCollection.get();
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      headers = ["Sipariş No", "Tarih", "Müşteri", "E-posta", "Durum", "Toplam (TL)", "Ürün Sayısı"];
      data = orders.map(o => [
        o.orderNumber || o.id,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString("tr-TR") : "",
        o.customer?.name || o.billingAddress?.name || "",
        o.customer?.email || o.billingAddress?.email || "",
        o.status || "pending",
        parseNumber(o.totals?.total, 0).toFixed(2),
        (o.items || []).length,
      ]);
      break;
    }

    case "customers": {
      const usersSnapshot = await usersCollection.get();
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      headers = ["Ad Soyad", "E-posta", "Telefon", "Şirket", "Kayıt Tarihi"];
      data = users.map(u => [
        u.displayName || u.name || "",
        u.email || "",
        u.phone || "",
        u.company || "",
        u.createdAt ? new Date(u.createdAt).toLocaleDateString("tr-TR") : "",
      ]);
      break;
    }

    case "products": {
      const productsSnapshot = await productsCollection.get();
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      headers = ["Ürün Adı", "SKU", "Kategori", "Fiyat (USD)", "Stok", "Durum"];
      data = products.map(p => [
        p.title || p.name || "",
        p.sku || "",
        p.category || "",
        parseNumber(p.priceUSD || p.price, 0).toFixed(2),
        parseNumber(p.stock, 0),
        getStockStatus(parseNumber(p.stock, 0)),
      ]);
      break;
    }

    case "sales": {
      const report = await getSalesReport(filters);
      headers = ["Dönem", "Sipariş Sayısı", "Ürün Adedi", "Ciro (TL)"];
      data = report.salesData.map(s => [
        s.period,
        s.orders,
        s.items,
        s.revenue.toFixed(2),
      ]);
      break;
    }
  }

  // Convert to CSV string
  const csvRows = [
    headers.join(","),
    ...data.map(row => row.map(cell => "\"" + String(cell).replace(/"/g, "\"\"") + "\"").join(",")),
  ];

  return csvRows.join("\n");
}

export default {
  getDashboardSummary,
  getSalesReport,
  getCustomerAnalytics,
  getProductAnalytics,
  exportToCSV,
};
