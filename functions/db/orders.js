import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentRate } from "./exchange-rates.js";

// Collection references
const ordersCollection = db.collection("orders");
const customersCollection = db.collection("customers");
const productsCollection = db.collection("products"); // Ürün bilgilerini almak için

const mapTimestamp = (value) => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  // Firestore Timestamp objesini Date objesine dönüştür
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(value).toISOString();
};

const parseNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeStatus = (status) => (status || "").toLowerCase();

// Benzersiz sipariş numarası oluştur (SVD-YYYYMMDD-XXXX)
const generateOrderNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  
  // Bugünün siparişlerini say
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const todayOrders = await ordersCollection
    .where("createdAt", ">=", startOfDay)
    .where("createdAt", "<", endOfDay)
    .get();
  
  const orderCount = todayOrders.size + 1;
  const paddedCount = orderCount.toString().padStart(4, "0");
  
  return `SVD-${dateStr}-${paddedCount}`;
};

const mapOrderDoc = (doc) => {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  const items = Array.isArray(data.items) ? data.items : [];
  const mappedItems = items.map((item) => ({
    id: item.id || item.product_id || "",
    title: item.title || "",
    quantity: parseNumber(item.quantity, 0),
    price: parseNumber(item.price ?? item.unit_price, 0),
    subtotal: parseNumber(item.subtotal, parseNumber(item.price ?? item.unit_price, 0) * parseNumber(item.quantity, 0)),
    category: item.category || null,
  }));

  return {
    id: doc.id,
    orderNumber: data.orderNumber || null,
    exchangeRate: data.exchangeRate || null,
    status: data.status,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
    customer: data.customer || {},
    items: mappedItems,
    totals: data.totals || {
      subtotal: 0,
      currency: "TRY",
      discountTotal: 0,
      shippingTotal: 0,
      total: 0,
      comboDiscount: 0,
      finalTotal: 0,
    },
    comboMatches: data.comboMatches || [],
    metadata: data.metadata || {},
  };
};

const listOrders = async (filters = {}) => {
  let queryRef = ordersCollection.orderBy("createdAt", "desc");

  if (filters.from) {
    queryRef = queryRef.where("createdAt", ">=", new Date(filters.from));
  }

  if (filters.to) {
    queryRef = queryRef.where("createdAt", "<=", new Date(filters.to));
  }

  if (filters.status && filters.status !== "all") {
    queryRef = queryRef.where("status", "==", normalizeStatus(filters.status));
  }

  if (filters.userId) {
    queryRef = queryRef.where("customer.userId", "==", filters.userId);
  }

  const snapshot = await queryRef.get();
  return snapshot.docs.map(mapOrderDoc);
};

const getOrderById = async (id) => {
  const doc = await ordersCollection.doc(id).get();
  return mapOrderDoc(doc);
};

const upsertCustomer = async (customer = {}) => {
  const name = (customer.name || "").trim();
  const company = (customer.company || "").trim();
  const email = (customer.email || "").trim().toLowerCase();
  const phone = (customer.phone || "").trim();
  const taxNumber = (customer.taxNumber || customer.tax_number || "").trim();
  const address = (customer.address || "").trim();
  const city = (customer.city || "").trim();
  const notes = (customer.notes || "").trim();
  const userId = customer.userId || null;

  const customerData = {
    name,
    company,
    email,
    phone,
    taxNumber,
    address,
    city,
    notes,
    userId,
    updatedAt: FieldValue.serverTimestamp(),
  };

  let customerId;
  if (email) {
    const snapshot = await customersCollection.where("email", "==", email).limit(1).get();
    if (!snapshot.empty) {
      customerId = snapshot.docs[0].id;
      await customersCollection.doc(customerId).update(customerData);
    } else {
      const docRef = await customersCollection.add({
        ...customerData,
        createdAt: FieldValue.serverTimestamp(),
      });
      customerId = docRef.id;
    }
  } else {
    const docRef = await customersCollection.add({
      ...customerData,
      createdAt: FieldValue.serverTimestamp(),
    });
    customerId = docRef.id;
  }
  return customerId;
};

const createOrder = async (payload) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const totals = payload.totals || {};
  const id = payload.id || `order-${Date.now()}`;
  const status = (payload.status || "pending").toLowerCase();
  const currency = totals.currency || "TRY";
  const subtotal = parseNumber(totals.subtotal, items.reduce((sum, item) => {
    const quantity = parseNumber(item.quantity, 0);
    const unitPrice = parseNumber(item.price ?? item.unit_price, 0);
    // Calculate actual quantity considering package info
    const actualQuantity = item.packageInfo && item.packageInfo.itemsPerBox
      ? quantity * item.packageInfo.itemsPerBox
      : quantity;
    return sum + actualQuantity * unitPrice;
  }, 0));
  const shippingTotal = parseNumber(totals.shippingTotal ?? payload.shippingTotal, 0);
  const discountTotal = parseNumber(totals.discountTotal ?? payload.discountTotal, 0);
  const comboDiscount = parseNumber(totals.comboDiscount, 0);
  const comboMatches = Array.isArray(payload.comboMatches) ? payload.comboMatches : [];
  const finalTotal = parseNumber(totals.finalTotal, subtotal - comboDiscount);
  const total = finalTotal + shippingTotal - discountTotal;

  const now = FieldValue.serverTimestamp();

  // Generate order number
  const orderNumber = await generateOrderNumber();

  // Get current exchange rate
  let exchangeRate = null;
  try {
    const rateData = await getCurrentRate("USD");
    exchangeRate = rateData.rate;
  } catch (error) {
    console.warn("[Orders] Could not fetch exchange rate:", error.message);
  }

  const customerId = await upsertCustomer(payload.customer);
  const customerDoc = await customersCollection.doc(customerId).get();
  const customerData = customerDoc.exists ? customerDoc.data() : {};

  const orderData = {
    orderNumber,
    exchangeRate,
    status,
    createdAt: now,
    updatedAt: now,
    customer: { id: customerId, ...customerData },
    items: items.map(item => {
      const quantity = parseNumber(item.quantity, 0);
      const unitPrice = parseNumber(item.price ?? item.unit_price, 0);

      // Calculate actual quantity considering package info
      const actualQuantity = item.packageInfo && item.packageInfo.itemsPerBox
        ? quantity * item.packageInfo.itemsPerBox
        : quantity;

      // Calculate subtotal using actual quantity
      const calculatedSubtotal = unitPrice * actualQuantity;

      return {
        id: item.id || item.product_id || "",
        title: item.title || "",
        quantity,
        price: unitPrice,
        subtotal: parseNumber(item.subtotal, calculatedSubtotal),
        category: item.category || null,
        packageInfo: item.packageInfo || null,
      };
    }),
    totals: {
      subtotal,
      currency,
      discountTotal,
      shippingTotal,
      comboDiscount,
      finalTotal,
      total,
    },
    comboMatches,
    metadata: payload.metadata || {},
  };

  await ordersCollection.doc(id).set(orderData);
  return getOrderById(id);
};

const updateOrderStatus = async (id, status) => {
  const normalizedStatus = status ? status.toLowerCase() : null;
  if (!normalizedStatus) {
    throw new Error("Status value is required");
  }

  const now = FieldValue.serverTimestamp();
  await ordersCollection.doc(id).update({
    status: normalizedStatus,
    updatedAt: now,
  });

  return getOrderById(id);
};

const getStatsOverview = async (filters = {}) => {
  const normalizedStatus = filters.status && filters.status !== "all" ? filters.status.toLowerCase() : null;
  const orders = await listOrders({
    from: filters.from,
    to: filters.to,
    status: normalizedStatus,
  });

  const requestedCategory = filters.category && filters.category !== "all" ? filters.category : null;

  let totalRevenue = 0;
  let pendingOrders = 0;
  const categoryTotals = new Map();
  const monthlyTotals = new Map();

  for (const order of orders) {
    const orderStatus = normalizeStatus(order.status);
    const orderTotal = parseNumber(order.totals?.subtotal, 0);

    if (orderStatus === "pending" || orderStatus === "beklemede") {
      pendingOrders += 1;
    }

    totalRevenue += orderTotal;

    const createdAtDate = order.createdAt ? new Date(order.createdAt) : null;
    if (createdAtDate && !Number.isNaN(createdAtDate.valueOf())) {
      const monthKey = `${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + orderTotal);
    }

    for (const item of (order.items || [])) {
      let category = item.category || "other";
      // Eğer ürünün kategorisi yoksa, ürün koleksiyonundan çekmeye çalış
      if (!item.category && item.id) {
        const productDoc = await productsCollection.doc(item.id).get();
        if (productDoc.exists) {
          const productData = productDoc.data();
          category = productData.category || "other";
        }
      }

      if (requestedCategory && category !== requestedCategory) {
        continue;
      }
      const amount = parseNumber(item.subtotal, parseNumber(item.price, 0) * parseNumber(item.quantity, 0));
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
    }
  }

  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders,
    averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
    categorySales: Array.from(categoryTotals.entries()).map(([category, total]) => ({ category, total })),
    monthlySales: Array.from(monthlyTotals.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => (a.month > b.month ? 1 : -1)),
  };
};

export {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getStatsOverview,
};
