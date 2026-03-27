// -----------------------------------------------------
// SUPABASE INITIALIZATION
// -----------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mrmnstplsfupynafleht.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fwh5PGuYIajjwam7rE2Z3w_JRFqv-VG";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// -----------------------------------------------------
// ADMIN LOGIN
// -----------------------------------------------------
const loginBtn = document.getElementById("login-btn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    // Hide login, show dashboard
    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard-section").style.display = "block";
  });
}


// -----------------------------------------------------
// PHOTO UPLOAD
// -----------------------------------------------------
const uploadBtn = document.getElementById("upload-photo-btn");
const photoInput = document.getElementById("photo-input");
const uploadStatus = document.getElementById("upload-status");

if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const file = photoInput.files[0];

    if (!file) {
      uploadStatus.textContent = "Please select a file first.";
      return;
    }

    const filePath = `${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("photos")
      .upload(filePath, file);

    if (error) {
      uploadStatus.textContent = "Upload failed: " + error.message;
      return;
    }

    // Insert metadata into database
    const { error: dbError } = await supabase
      .from("photos")
      .insert({ file_path: filePath });

    if (dbError) {
      uploadStatus.textContent =
        "Uploaded, but failed to save metadata: " + dbError.message;
      return;
    }

    uploadStatus.textContent = "Photo uploaded successfully!";
  });
}
