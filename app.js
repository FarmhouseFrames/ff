// ===== Supabase client =====
const SUPABASE_URL = "https://mrmnstplsfupynafleht.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fwh5PGuYIajjwam7rE2Z3w_JRFqv-VG";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Helpers =====
const $ = id => document.getElementById(id);

/** Escape a value for safe insertion into innerHTML. */
function esc(val) {
  return String(val == null ? "" : val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== Tab titles =====
const TAB_TITLES = {
  overview: "Dashboard Overview",
  orders:   "Orders",
  products: "Product Catalog",
  media:    "Media Library",
  settings: "Settings",
};

// ===== Login =====
$("login-button").addEventListener("click", async () => {
  const email    = $("login-email").value.trim();
  const password = $("login-password").value.trim();

  if (!email || !password) {
    $("login-status").textContent = "Please enter your email and password.";
    return;
  }

  $("login-status").textContent = "Logging in\u2026";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    $("login-status").textContent = "Login failed: " + error.message;
    return;
  }

  showDashboard();
});

// ===== Auto-login on page load =====
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    showDashboard();
  }
})();

// ===== Show / hide login vs dashboard =====
function showDashboard() {
  $("login-wrap").style.display  = "none";
  $("admin-wrap").style.display  = "flex";
  switchTab("overview");
}

// ===== Logout =====
$("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  $("admin-wrap").style.display  = "none";
  $("login-wrap").style.display  = "flex";
  $("login-status").textContent  = "";
  $("login-email").value         = "";
  $("login-password").value      = "";
});

// ===== Tab navigation =====
document.querySelectorAll("[data-tab]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    switchTab(link.dataset.tab);
  });
});

function switchTab(tab) {
  // Sidebar active state
  document.querySelectorAll("[data-tab]").forEach(a => a.classList.remove("active"));
  const activeLink = document.querySelector(`[data-tab="${tab}"]`);
  if (activeLink) activeLink.classList.add("active");

  // Show correct section
  document.querySelectorAll(".tab-section").forEach(s => s.style.display = "none");
  const section = $("tab-" + tab);
  if (section) section.style.display = "block";

  // Page header title
  $("page-title").textContent = TAB_TITLES[tab] || tab;

  // Load data
  if      (tab === "overview") loadOverview();
  else if (tab === "orders")   loadOrders();
  else if (tab === "products") loadProducts();
  else if (tab === "media")    loadPhotos();
  else if (tab === "settings") loadSettings();
}

// ===== OVERVIEW =====
async function loadOverview() {
  // Fetch orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch photo count
  const { data: photos } = await supabase
    .from("photos")
    .select("id");

  // Fetch products from JSON
  let products = [];
  try {
    const res = await fetch("data/products.json");
    products  = await res.json();
  } catch (_) { /* non-critical */ }

  // Update stat cards
  if (orders) {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    $("stat-orders").querySelector(".stat-value").textContent  = orders.length;
    $("stat-revenue").querySelector(".stat-value").textContent = "$" + totalRevenue.toFixed(2);
  } else {
    $("stat-orders").querySelector(".stat-value").textContent  = "0";
    $("stat-revenue").querySelector(".stat-value").textContent = "$0.00";
  }

  $("stat-products").querySelector(".stat-value").textContent = products.length || 0;
  $("stat-photos").querySelector(".stat-value").textContent   = (photos && photos.length) || 0;

  // Recent orders table (up to 5)
  const recentEl = $("recent-orders-list");
  if (orders && orders.length) {
    renderOrderTable(recentEl, orders.slice(0, 5), /* compact= */ true);
  } else {
    recentEl.innerHTML = "<p style='color:#90a4ae'>No orders yet.</p>";
  }
}

// ===== ORDERS =====
async function loadOrders() {
  const wrap = $("orders-table-wrap");
  wrap.innerHTML = "Loading\u2026";

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    wrap.innerHTML = "<p style='color:#c0392b'>Could not load orders: " + esc(error.message) + "</p>";
    return;
  }

  if (!orders || !orders.length) {
    wrap.innerHTML = "<p style='color:#90a4ae'>No orders yet.</p>";
    return;
  }

  renderOrderTable(wrap, orders, /* compact= */ false);
}

/** Render an orders table into `container`.
 *  compact=true omits email column and status-update control. */
function renderOrderTable(container, orders, compact) {
  const headers = compact
    ? ["#", "Customer", "Product", "Amount", "Status", "Date"]
    : ["#", "Customer", "Email", "Product", "Amount", "Status", "Date", "Update Status"];

  const rows = orders.map(o => {
    const date   = o.created_at ? new Date(o.created_at).toLocaleDateString() : "\u2014";
    const status = o.status || "pending";
    const cls    = status === "fulfilled" ? "status-fulfilled"
                 : status === "cancelled" ? "status-cancelled"
                 : "status-pending";

    const actionCell = compact ? "" : `
      <td>
        <select class="status-select" data-order-id="${esc(o.id)}">
          <option value="pending"   ${status === "pending"   ? "selected" : ""}>Pending</option>
          <option value="fulfilled" ${status === "fulfilled" ? "selected" : ""}>Fulfilled</option>
          <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>`;

    const emailCell = compact ? "" : `<td>${esc(o.customer_email || "\u2014")}</td>`;

    return `<tr>
      <td>${esc(o.id || "\u2014")}</td>
      <td>${esc(o.customer_name || "\u2014")}</td>
      ${emailCell}
      <td>${esc(o.product || "\u2014")}</td>
      <td>$${(+(o.amount) || 0).toFixed(2)}</td>
      <td><span class="status-badge ${cls}">${esc(status)}</span></td>
      <td>${date}</td>
      ${actionCell}
    </tr>`;
  }).join("");

  container.innerHTML = `
    <table class="data-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  if (!compact) {
    container.querySelectorAll(".status-select").forEach(sel => {
      sel.addEventListener("change", async () => {
        const { error } = await supabase
          .from("orders")
          .update({ status: sel.value })
          .eq("id", sel.dataset.orderId);
        if (error) {
          alert("Could not update status: " + error.message);
          // Reload to restore correct value
          loadOrders();
        }
      });
    });
  }
}

// ===== PRODUCTS =====
async function loadProducts() {
  const wrap = $("products-table-wrap");
  wrap.innerHTML = "Loading\u2026";

  let products = [];
  try {
    const res = await fetch("data/products.json");
    products  = await res.json();
  } catch (e) {
    wrap.innerHTML = "<p style='color:#c0392b'>Could not load products.json.</p>";
    return;
  }

  if (!products.length) {
    wrap.innerHTML = "<p style='color:#90a4ae'>No products found.</p>";
    return;
  }

  const rows = products.map(p => `
    <tr>
      <td>${esc(p.id)}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.category || "\u2014")}</td>
      <td>${esc(p.dimensions || "\u2014")}</td>
      <td>${esc(p.pieces || "\u2014")}</td>
      <td>$${(+(p.walmartCost) || 0).toFixed(2)}</td>
      <td>$${(+(p.sellingPrice) || 0).toFixed(2)}</td>
      <td>${p.walmartLink
          ? `<a href="${esc(p.walmartLink)}" target="_blank" rel="noopener">View</a>`
          : "\u2014"}</td>
    </tr>`).join("");

  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>#</th><th>Name</th><th>Category</th><th>Dimensions</th>
        <th>Pieces</th><th>Cost</th><th>Price</th><th>Link</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ===== MEDIA – UPLOAD =====
$("upload-button").addEventListener("click", async () => {
  const file = $("photo-input").files[0];
  if (!file) {
    $("upload-status").textContent = "Please choose a file first.";
    return;
  }

  $("upload-status").textContent = "Uploading\u2026";

  const filePath = Date.now() + "-" + file.name;

  const { error: storageError } = await supabase.storage
    .from("photos")
    .upload(filePath, file);

  if (storageError) {
    $("upload-status").textContent = "Upload failed: " + storageError.message;
    return;
  }

  const { error: dbError } = await supabase
    .from("photos")
    .insert({ file_path: filePath });

  if (dbError) {
    $("upload-status").textContent = "Database error: " + dbError.message;
    return;
  }

  $("upload-status").textContent = "Uploaded successfully!";
  $("photo-input").value = "";
  loadPhotos();
});

// ===== MEDIA – GALLERY =====
async function loadPhotos() {
  const gallery = $("photo-gallery");
  gallery.innerHTML = "Loading\u2026";

  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    gallery.innerHTML = "<p style='color:#c0392b'>Failed to load photos: " + esc(error.message) + "</p>";
    return;
  }

  if (!data || !data.length) {
    gallery.innerHTML = "<p style='color:#90a4ae'>No photos uploaded yet.</p>";
    return;
  }

  gallery.innerHTML = '<div class="photo-grid">' +
    data.map(photo => {
      const { data: pub } = supabase.storage
        .from("photos")
        .getPublicUrl(photo.file_path);
      const date = photo.created_at
        ? new Date(photo.created_at).toLocaleDateString()
        : "";
      return `<div class="photo-item">
        <img src="${esc(pub.publicUrl)}" alt="${esc(photo.file_path)}" loading="lazy">
        <div class="photo-item-info">
          <div class="photo-name">${esc(photo.file_path)}</div>
          <div class="photo-date">${date}</div>
          <button class="btn btn-danger btn-sm delete-photo-btn"
                  data-path="${esc(photo.file_path)}"
                  data-id="${esc(photo.id)}">Delete</button>
        </div>
      </div>`;
    }).join("") +
  "</div>";

  gallery.querySelectorAll(".delete-photo-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to permanently delete this photo? This action cannot be undone.")) return;
      btn.disabled = true;
      await supabase.storage.from("photos").remove([btn.dataset.path]);
      await supabase.from("photos").delete().eq("id", btn.dataset.id);
      loadPhotos();
    });
  });
}

// ===== SETTINGS =====
async function loadSettings() {
  const el = $("settings-content");
  let config = {};
  try {
    const res = await fetch("data/config.json");
    config    = await res.json();
  } catch (e) {
    el.innerHTML = "<p style='color:#c0392b'>Could not load config.json.</p>";
    return;
  }

  const row = (label, value, mono = false) => `
    <div class="setting-row">
      <span class="setting-label">${label}</span>
      <span class="setting-value${mono ? " monospace" : ""}">${value}</span>
    </div>`;

  const stripeDisplay = config.stripePublishableKey
    ? esc(config.stripePublishableKey.slice(0, 24)) + "\u2026"
    : "\u2014";

  const collectionsDisplay = (config.collections || []).map(c => esc(c)).join(", ") || "\u2014";

  el.innerHTML =
    row("Business Name", esc(config.businessName || "\u2014")) +
    row("Email",         `<a href="mailto:${esc(config.businessEmail)}">${esc(config.businessEmail || "\u2014")}</a>`) +
    row("Domain",        esc(config.domain || "\u2014")) +
    row("Currency",      esc(config.currency || "\u2014")) +
    row("Tax Rate",      ((config.tax || 0) * 100).toFixed(0) + "%") +
    row("Profit Margin", ((config.profitMargin || 0) * 100).toFixed(0) + "%") +
    row("Stripe Key",    stripeDisplay, true) +
    row("Collections",   collectionsDisplay) +
    `<p class="settings-note">To update settings, edit <code>data/config.json</code> in the repository.</p>`;
