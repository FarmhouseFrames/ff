<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Farmhouse Frames Admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    header {
      background: #2f3b4c;
      color: #fff;
      padding: 16px 24px;
    }
    main {
      max-width: 960px;
      margin: 24px auto;
      background: #fff;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    h2 { margin-top: 0; }
    .section { margin-bottom: 32px; }
    label { display: block; margin-bottom: 4px; font-weight: 600; }
    input[type="email"], input[type="password"] {
      width: 100%; padding: 8px; margin-bottom: 12px;
      border-radius: 4px; border: 1px solid #ccc;
    }
    button {
      background: #2f3b4c; color: #fff; border: none;
      padding: 8px 16px; border-radius: 4px; cursor: pointer;
    }
    #dashboard-section { display: none; }
    #photo-gallery {
      display: flex; flex-wrap: wrap; gap: 20px; margin-top: 12px;
    }
    .photo-item { width: 200px; font-size: 12px; color: #555; }
    .photo-item img {
      width: 100%; border-radius: 8px; object-fit: cover;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

<header>
  <h1>Farmhouse Frames · Admin Dashboard</h1>
</header>

<main>

  <!-- LOGIN -->
  <section id="login-section" class="section">
    <h2>Admin Login</h2>
    <p id="login-status"></p>

    <label>Email</label>
    <input type="email" id="login-email" />

    <label>Password</label>
    <input type="password" id="login-password" />

    <button id="login-button">Log In</button>
  </section>

  <!-- DASHBOARD -->
  <section id="dashboard-section" class="section">
    <h2>Welcome, Admin</h2>
    <p id="dashboard-status"></p>

    <div class="section">
      <h3>Upload Photo</h3>
      <input type="file" id="photo-input" accept="image/*" />
      <button id="upload-button">Upload</button>
      <p id="upload-status"></p>
    </div>

    <div class="section">
      <h3>Uploaded Photos</h3>
      <div id="photo-gallery">No photos loaded yet.</div>
    </div>
  </section>

</main>

<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="app.js?v=1001"></script>

</body>
</html>
✅ Updated app.js with public.photos everywhere
js
// ===== Supabase client =====
const SUPABASE_URL = "https://mrmnstplsfupynafleht.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fwh5PGuYIajjwam7rE2Z3w_JRFqv-VG";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== DOM =====
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");
const loginStatus = document.getElementById("login-status");

const uploadInput = document.getElementById("photo-input");
const uploadButton = document.getElementById("upload-button");
const uploadStatus = document.getElementById("upload-status");

const dashboardStatus = document.getElementById("dashboard-status");
const photoGallery = document.getElementById("photo-gallery");

// ===== LOGIN =====
loginButton.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    loginStatus.textContent = "Enter email and password.";
    return;
  }

  loginStatus.textContent = "Logging in...";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginStatus.textContent = "Login failed.";
    return;
  }

  loginSection.style.display = "none";
  dashboardSection.style.display = "block";
  dashboardStatus.textContent = "You are logged in.";
  loadPhotos();
});

// ===== UPLOAD =====
uploadButton.addEventListener("click", async () => {
  const file = uploadInput.files[0];
  if (!file) {
    uploadStatus.textContent = "Choose a file first.";
    return;
  }

  uploadStatus.textContent = "Uploading...";

  const filePath = `${Date.now()}-${file.name}`;

  // 1. Upload to storage
  const { error: storageError } = await supabase.storage
    .from("photos")
    .upload(filePath, file);

  if (storageError) {
    uploadStatus.textContent = "Storage upload failed.";
    return;
  }

  // 2. Insert DB row (schema-qualified)
  const { error: dbError } = await supabase
    .from("public.photos")
    .insert({ file_path: filePath });

  if (dbError) {
    uploadStatus.textContent = "Database insert failed.";
    return;
  }

  uploadStatus.textContent = "Upload successful!";
  uploadInput.value = "";
  loadPhotos();
});

// ===== LOAD PHOTOS =====
async function loadPhotos() {
  photoGallery.textContent = "Loading...";

  const { data, error } = await supabase
    .from("public.photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    photoGallery.textContent = "Failed to load photos.";
    return;
  }

  if (!data.length) {
    photoGallery.textContent = "No photos uploaded yet.";
    return;
  }

  photoGallery.innerHTML = "";

  data.forEach((photo) => {
    const { data: publicData } = supabase.storage
      .from("photos")
      .getPublicUrl(photo.file_path);

    const url = publicData.publicUrl;

    const item = document.createElement("div");
    item.className = "photo-item";

    item.innerHTML = `
      <img src="${url}">
      <div>${photo.file_path}</div>
      <div>${new Date(photo.created_at).toLocaleString()}</div>
    `;

    photoGallery.appendChild(item);
  });
}

// ===== AUTO LOGIN CHECK =====
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    loginSection.style.display = "none";
    dashboardSection.style.display = "block";
    dashboardStatus.textContent = "You are logged in.";
    loadPhotos();
  }
})();
