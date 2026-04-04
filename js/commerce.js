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

const STUDIO_LOCATION = {
  state: 'KY',
  country: 'US'
};

const NEARBY_STATES = new Set(['KY', 'TN', 'IN', 'IL', 'MO', 'OH', 'WV', 'VA']);

function parseAddress(addressText = '') {
  const text = String(addressText || '').trim().toUpperCase();
  const stateMatch = text.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);
  const country = text.includes('CANADA') ? 'CA' : text.includes('UNITED STATES') || text.includes('USA') || /\bUS\b/.test(text) ? 'US' : '';

  return {
    state: stateMatch ? stateMatch[1] : '',
    country
  };
}

export function estimateCustomerShipping({ address = '', fulfillment = 'Pickup', itemCount = 0, subtotal = 0 }) {
  if (String(fulfillment || '').toLowerCase() !== 'shipping') {
    return 0;
  }

  const parsed = parseAddress(address);
  const quantityFactor = Math.max(0, Number(itemCount || 0) - 1) * 1.5;
  const handlingBase = 4;
  const valueProtection = Math.min(18, Math.max(0, Number(subtotal || 0) * 0.04));

  let zoneBase = 10;

  if (!parsed.country || parsed.country === STUDIO_LOCATION.country) {
    if (parsed.state === STUDIO_LOCATION.state) {
      zoneBase = 6;
    } else if (NEARBY_STATES.has(parsed.state)) {
      zoneBase = 9;
    } else if (parsed.state === 'AK' || parsed.state === 'HI') {
      zoneBase = 24;
    } else {
      zoneBase = 13;
    }
  } else if (parsed.country === 'CA') {
    zoneBase = 28;
  } else {
    zoneBase = 35;
  }

  return Number((zoneBase + handlingBase + quantityFactor + valueProtection).toFixed(2));
}

export function calculateCartTotals(items, taxRate = 0, shipping = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * Number(taxRate || 0);
  const shippingTotal = Number(shipping || 0);
  const total = subtotal + tax + shippingTotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    shipping: shippingTotal,
    total,
    itemCount
  };
}

export function formatCartSummary(items, config, formValues, totalsOverride = null) {
  const totals = totalsOverride || calculateCartTotals(items, config.tax, 0);
  const itemLines = items.map((item) => {
    const size = item.size ? `, Size: ${item.size}` : '';
    return `- ${item.title} x${item.quantity}${size} — ${formatCurrency(item.price * item.quantity, config.currency)}`;
  }).join('%0D%0A');

  const lines = [
    `Customer: ${formValues.name}`,
    `Email: ${formValues.email}`,
    `Phone: ${formValues.phone || 'Not provided'}`,
    `Fulfillment: ${formValues.fulfillment}`,
    `Address: ${formValues.address || 'Not provided'}`,
    `Notes: ${formValues.notes || 'None'}`,
    '',
    'Items:',
    itemLines,
    '',
    `Subtotal: ${formatCurrency(totals.subtotal, config.currency)}`,
    `Tax: ${formatCurrency(totals.tax, config.currency)}`,
    `Shipping: ${formatCurrency(totals.shipping || 0, config.currency)}`,
    `Total: ${formatCurrency(totals.total, config.currency)}`
  ];

  return lines.join('%0D%0A');
}

export { formatCurrency };
