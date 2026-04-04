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
      .select('business_email, tax_rate, currency, hosted_payment_url, tax_mode, shipping_origin_zip, shipping_quote_api_url')
      .eq('id', 'storefront')
      .maybeSingle();

    if (!error && data) {
      return {
        businessEmail: data.business_email || 'kristin@farmhouseframes.com',
        tax: Number(data.tax_rate ?? 0),
        currency: data.currency || 'USD',
        hostedPaymentUrl: data.hosted_payment_url || '',
        taxMode: data.tax_mode || 'destination_state',
        shippingOriginZip: data.shipping_origin_zip || '42701',
        shippingQuoteApiUrl: data.shipping_quote_api_url || ''
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

const DESTINATION_STATE_TAX_RATES = {
  AL: 0.04,
  AK: 0,
  AZ: 0.056,
  AR: 0.065,
  CA: 0.0725,
  CO: 0.029,
  CT: 0.0635,
  DE: 0,
  FL: 0.06,
  GA: 0.04,
  HI: 0.04,
  ID: 0.06,
  IL: 0.0625,
  IN: 0.07,
  IA: 0.06,
  KS: 0.065,
  KY: 0.06,
  LA: 0.0445,
  ME: 0.055,
  MD: 0.06,
  MA: 0.0625,
  MI: 0.06,
  MN: 0.0688,
  MS: 0.07,
  MO: 0.0423,
  MT: 0,
  NE: 0.055,
  NV: 0.0685,
  NH: 0,
  NJ: 0.0663,
  NM: 0.0513,
  NY: 0.04,
  NC: 0.0475,
  ND: 0.05,
  OH: 0.0575,
  OK: 0.045,
  OR: 0,
  PA: 0.06,
  RI: 0.07,
  SC: 0.06,
  SD: 0.045,
  TN: 0.07,
  TX: 0.0625,
  UT: 0.061,
  VT: 0.06,
  VA: 0.053,
  WA: 0.065,
  WV: 0.06,
  WI: 0.05,
  WY: 0.04,
  DC: 0.06
};

function parseAddress(addressText = '') {
  const text = String(addressText || '').trim().toUpperCase();
  const stateMatch = text.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);
  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  const country = text.includes('CANADA') ? 'CA' : text.includes('UNITED STATES') || text.includes('USA') || /\bUS\b/.test(text) ? 'US' : '';

  return {
    state: stateMatch ? stateMatch[1] : '',
    zip: zipMatch ? zipMatch[1] : '',
    country
  };
}

export function estimateDestinationTaxRate({ address = '', fulfillment = 'Pickup', defaultTaxRate = 0, taxMode = 'destination_state' }) {
  const normalizedMode = String(taxMode || 'destination_state').toLowerCase();
  if (normalizedMode !== 'destination_state') {
    return Number(defaultTaxRate || 0);
  }

  if (String(fulfillment || '').toLowerCase() !== 'shipping') {
    return Number(defaultTaxRate || 0);
  }

  const parsed = parseAddress(address);
  if (parsed.country && parsed.country !== 'US') {
    return 0;
  }

  if (!parsed.state) {
    return Number(defaultTaxRate || 0);
  }

  return Number(DESTINATION_STATE_TAX_RATES[parsed.state] ?? Number(defaultTaxRate || 0));
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

export async function quoteCustomerShipping({
  address = '',
  fulfillment = 'Pickup',
  itemCount = 0,
  subtotal = 0,
  apiUrl = '',
  originZip = '42701'
}) {
  if (String(fulfillment || '').toLowerCase() !== 'shipping') {
    return { amount: 0, source: 'pickup' };
  }

  const fallbackEstimate = estimateCustomerShipping({ address, fulfillment, itemCount, subtotal });
  const endpoint = String(apiUrl || '').trim();

  if (!endpoint) {
    return { amount: fallbackEstimate, source: 'estimate' };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_zip: String(originZip || '42701').trim(),
        destination_address: String(address || '').trim(),
        item_count: Number(itemCount || 0),
        subtotal: Number(subtotal || 0)
      })
    });

    if (!response.ok) {
      throw new Error(`Shipping quote request failed (${response.status})`);
    }

    const payload = await response.json();
    const amount = Number(payload?.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Shipping quote payload is invalid');
    }

    return {
      amount: Number(amount.toFixed(2)),
      source: 'carrier_api'
    };
  } catch {
    return { amount: fallbackEstimate, source: 'estimate_fallback' };
  }
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
