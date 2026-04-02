import { publicSupabase } from './supabasePublic.js';

function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(value || 0);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
}

export async function loadStoreConfig() {
  try {
    const { data, error } = await publicSupabase
      .from('store_settings')
      .select('business_email, tax_rate, currency, hosted_payment_url')
      .eq('id', 'storefront')
      .maybeSingle();

    if (!error && data) {
      return {
        businessEmail: data.business_email || 'kristin@farmhouseframes.com',
        tax: Number(data.tax_rate ?? 0),
        currency: data.currency || 'USD',
        hostedPaymentUrl: data.hosted_payment_url || ''
      };
    }
  } catch {
    // Fall back to static JSON config if Supabase read is unavailable.
  }

  return fetchJson('./data/config.json');
}

export function normalizeCartItem(item, index) {
  return {
    productId: item.productId || item.id || `line-${index + 1}`,
    title: item.title || item.name || 'Untitled product',
    price: Number(item.price || 0),
    size: item.size || '',
    quantity: Math.max(1, Number(item.quantity || 1)),
    image: item.image || '',
    notes: item.notes || ''
  };
}

export function readCart() {
  const raw = JSON.parse(localStorage.getItem('cart') || '[]');
  return Array.isArray(raw) ? raw.map(normalizeCartItem) : [];
}

export function saveCart(items) {
  localStorage.setItem('cart', JSON.stringify(items));
}

export function updateCartItem(index, updates) {
  const cart = readCart();
  if (!cart[index]) {
    return cart;
  }
  cart[index] = { ...cart[index], ...updates };
  saveCart(cart);
  return cart;
}

export function removeCartItem(index) {
  const cart = readCart().filter((_, itemIndex) => itemIndex !== index);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function calculateCartTotals(items, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * Number(taxRate || 0);
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    total,
    itemCount
  };
}

export function formatCartSummary(items, config, formValues) {
  const totals = calculateCartTotals(items, config.tax);
  const itemLines = items.map((item) => {
    const size = item.size ? `, Size: ${item.size}` : '';
    return `- ${item.title} x${item.quantity}${size} — ${formatCurrency(item.price * item.quantity, config.currency)}`;
  }).join('%0D%0A');

  const lines = [
    `Customer: ${formValues.name}`,
    `Email: ${formValues.email}`,
    `Fulfillment: ${formValues.fulfillment}`,
    `Notes: ${formValues.notes || 'None'}`,
    '',
    'Items:',
    itemLines,
    '',
    `Subtotal: ${formatCurrency(totals.subtotal, config.currency)}`,
    `Tax: ${formatCurrency(totals.tax, config.currency)}`,
    `Total: ${formatCurrency(totals.total, config.currency)}`
  ];

  return lines.join('%0D%0A');
}

export { formatCurrency };
