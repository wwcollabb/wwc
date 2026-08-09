/* ==========================================================
   KashRun — Supabase client
   Public/publishable key only. Never put a secret or
   service-role key in this file — it ships to GitHub Pages.
   ========================================================== */

const SUPABASE_URL = "https://kkqnnqerklsayonxraqh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ugr5ZCa43_rud1x_elVihw_YMRE89-v";

// supabase-js is loaded globally via the CDN <script> tag on each page
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/* ---------- Small shared helpers used across every page ---------- */

function krToast(message) {
  let el = document.getElementById("kr-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "kr-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2400);
}

function krFriendlyError(error) {
  // Never expose raw Supabase/Postgres error internals to the user.
  if (!error) return "Something went wrong. Please try again.";
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("user already registered")) return "An account with this email already exists.";
  if (msg.includes("email not confirmed")) return "Please confirm your email before logging in.";
  if (msg.includes("failed to fetch") || msg.includes("network")) return "Network issue — please check your connection and try again.";
  if (msg.includes("password")) return "Password must be at least 6 characters.";
  return "Something went wrong. Please try again.";
}

function krFormatPrice(n) {
  const num = Number(n || 0);
  return "₹" + num.toLocaleString("en-IN");
}

function krQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function krRedirectToLogin(nextPath) {
  const next = nextPath || window.location.pathname + window.location.search;
  window.location.href = "login.html?next=" + encodeURIComponent(next);
}

function krRootPath() {
  // Handles pages inside /seller and /admin needing to reach root-relative assets
  return window.location.pathname.includes("/seller/") || window.location.pathname.includes("/admin/") ? "../" : "";
}
