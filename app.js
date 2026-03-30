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

  const { error: storageError } = await supabase.storage
    .from("photos")
    .upload(filePath, file);

  if (storageError) {
    uploadStatus.textContent = "Storage upload failed.";
    return;
  }

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
