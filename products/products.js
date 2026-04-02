const FALLBACK_IMAGE_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ead9ca" />
      <stop offset="100%" stop-color="#d6b59a" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)" />
  <circle cx="925" cy="210" r="145" fill="rgba(255,255,255,0.34)" />
  <path d="M0 700 L250 480 L440 650 L680 360 L1010 710 L1200 540 L1200 900 L0 900 Z" fill="#b78562" opacity="0.88" />
  <path d="M0 760 L210 620 L440 760 L650 550 L940 760 L1200 620 L1200 900 L0 900 Z" fill="#8f5d40" opacity="0.88" />
  <text x="80" y="140" font-family="Georgia, serif" font-size="68" fill="#4d3425">Farmhouse Frames</text>
  <text x="80" y="220" font-family="Georgia, serif" font-size="34" fill="#6f4d38">Product Preview</text>
</svg>
`);

const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${FALLBACK_IMAGE_SVG}`;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toTitleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeImage(path) {
  if (!path) {
    return FALLBACK_IMAGE;
  }
  return path;
}

function parseSizesFromDimensions(dimensions) {
  if (!dimensions) {
    return [];
  }

  const matches = String(dimensions).match(/\d+\s*[x×]\s*\d+/gi);
  return matches ? matches.map((entry) => entry.replace(/\s+/g, '').replace('×', 'x')) : [];
}

function normalizeCategory(category, fallbackName = '') {
  if (category) {
    return category;
  }

  const slug = slugify(fallbackName);
  if (slug.includes('puzzle')) {
    return 'Puzzles';
  }
  if (slug.includes('desk')) {
    return 'Desk Canvases';
  }
  if (slug.includes('mounted')) {
    return 'Mounted Prints';
  }
  if (slug.includes('canvas')) {
    return 'Canvas Prints';
  }

  return 'Products';
}

function normalizeLegacyProduct(product) {
  const title = product.name || product.title || 'Untitled Product';
  const category = normalizeCategory(product.category, title);
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : parseSizesFromDimensions(product.dimensions);

  return {
    id: product.id ? String(product.id) : slugify(title),
    slug: slugify(product.id || title),
    title,
    category,
    price: Number(product.sellingPrice ?? product.price ?? 0),
    currency: product.currency || 'USD',
    description: product.description || '',
    image: normalizeImage(product.image),
    sizes,
    tags: Array.isArray(product.tags) ? product.tags : [slugify(category), slugify(product.layout || '')].filter(Boolean),
    inventory: Number(product.inventory ?? 0),
    notes: product.notes || '',
    source: product.source || 'legacy',
    raw: product
  };
}

function normalizeModernProduct(product) {
  const title = product.title || product.name || 'Untitled Product';
  return {
    id: String(product.id || slugify(title)),
    slug: slugify(product.id || title),
    title,
    category: normalizeCategory(product.category, title),
    price: Number(product.price ?? product.sellingPrice ?? 0),
    currency: product.currency || 'USD',
    description: product.description || '',
    image: normalizeImage(product.image),
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    inventory: Number(product.inventory ?? 0),
    notes: product.notes || '',
    source: product.source || 'modern',
    raw: product
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
}

export async function loadProducts() {
  const [legacyCatalog, modernCatalog] = await Promise.allSettled([
    fetchJson('../data/products.json'),
    fetchJson('./products.json')
  ]);

  const products = [];

  if (legacyCatalog.status === 'fulfilled' && Array.isArray(legacyCatalog.value)) {
    legacyCatalog.value.forEach((product) => {
      products.push(normalizeLegacyProduct(product));
    });
  }

  if (modernCatalog.status === 'fulfilled') {
    const entries = Array.isArray(modernCatalog.value) ? modernCatalog.value : [modernCatalog.value];
    entries.forEach((product) => {
      products.push(normalizeModernProduct(product));
    });
  }

  const uniqueProducts = new Map();
  products.forEach((product) => {
    uniqueProducts.set(product.slug, product);
  });

  return Array.from(uniqueProducts.values()).sort((left, right) => left.title.localeCompare(right.title));
}

export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(value || 0);
}

export function matchesCategory(product, category) {
  if (!category || category === 'all') {
    return true;
  }

  return slugify(product.category) === slugify(category)
    || slugify(product.title).includes(slugify(category))
    || product.tags.some((tag) => slugify(tag) === slugify(category));
}

export function findProduct(products, slugOrId) {
  return products.find((product) => product.slug === slugOrId || product.id === slugOrId) || null;
}

export function addToCart(product, selectedSize = '') {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push({
    productId: product.id,
    title: product.title,
    price: product.price,
    size: selectedSize,
    quantity: 1,
    image: product.image
  });
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function renderProductCard(product) {
  const sizes = product.sizes.length ? product.sizes.map((size) => `<span class="pill">${size}</span>`).join('') : '<span class="pill">Custom sizing</span>';

  return `
    <article class="product-card">
      <img class="product-image" src="${product.image}" alt="${product.title}">
      <div class="product-body">
        <div class="product-meta">${product.category}</div>
        <h3>${product.title}</h3>
        <p>${product.description || 'No description available yet.'}</p>
        <div class="price">${formatCurrency(product.price, product.currency)}</div>
        <div class="pill-row">${sizes}</div>
        <div class="product-actions">
          <a class="button-link primary" href="./product.html?id=${encodeURIComponent(product.slug)}">View details</a>
        </div>
      </div>
    </article>
  `;
}

export function buildPageTitle(category) {
  if (!category || category === 'all') {
    return 'All Products';
  }
  return toTitleCase(category);
}