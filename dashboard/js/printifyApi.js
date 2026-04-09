// dashboard/js/printifyApi.js
// Admin-only: Printify API integration for Farmhouse Frames
// DO NOT expose API key or use on public pages

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';

/**
 * Set your Printify API key here for local testing.
 * In production, use a secure method to inject this value.
 */

let PRINTIFY_API_KEY = null; // Set via setApiKey() or loadPrintifyToken()

/**
 * Loads the Printify API token from /data/printify-token.txt (local/admin only).
 * Returns a promise that resolves when the token is loaded.
 */
export async function loadPrintifyToken() {
    if (PRINTIFY_API_KEY) return;
    try {
        const res = await fetch('/data/printify-token.txt', { cache: 'no-store' });
        if (!res.ok) throw new Error('Token file not found');
        PRINTIFY_API_KEY = (await res.text()).trim();
    } catch (e) {
        console.error('Failed to load Printify API token:', e);
        throw e;
    }
}

export function setApiKey(key) {
    PRINTIFY_API_KEY = key;
}

function getHeaders() {
    if (!PRINTIFY_API_KEY) throw new Error('Printify API key not set');
    return {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json',
    };
}

export async function fetchPrintifyShops() {
    const res = await fetch(`${PRINTIFY_API_BASE}/shops.json`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch shops');
    return res.json();
}

export async function fetchPrintifyProducts(shopId) {
    const res = await fetch(`${PRINTIFY_API_BASE}/shops/${shopId}/products.json`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

// Add more API functions as needed (e.g., createOrder, updateProduct, etc.)
