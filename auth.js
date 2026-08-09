/* ==========================================================
   KashRun — Auth (Supabase email/password)
   ========================================================== */

async function krGetSession() {
  const { data } = await sb.auth.getSession();
  return data.session || null;
}

async function krGetUser() {
  const { data } = await sb.auth.getUser();
  return data.user || null;
}

async function krSignUp({ fullName, email, password }) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;

  // Ensure a profiles row exists for this user (id = auth uid)
  if (data.user) {
    await sb.from("profiles").upsert(
      { id: data.user.id, full_name: fullName, email },
      { onConflict: "id" }
    );
  }
  return data;
}

async function krSignIn({ email, password }) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function krSignOut() {
  await sb.auth.signOut();
  window.location.href = krRootPath() + "index.html";
}

/* ---------- Header account state (runs on every page) ---------- */
async function krInitHeaderAuth() {
  const accountLink = document.querySelector("[data-account-link]");
  if (!accountLink) return;

  const user = await krGetUser();
  if (user) {
    const label = accountLink.querySelector("[data-account-label]");
    if (label) label.textContent = "Account";
    accountLink.setAttribute("href", krRootPath() + "account.html");
    accountLink.setAttribute("title", user.email || "Account");
  } else {
    accountLink.setAttribute("href", krRootPath() + "login.html");
  }
}

/* Guard for pages that require login. Preserves intended destination. */
async function krRequireAuth() {
  const user = await krGetUser();
  if (!user) {
    krRedirectToLogin();
    return null;
  }
  return user;
}

/* After login, send the user back where they were headed. */
function krPostLoginRedirect() {
  const next = krQueryParam("next");
  window.location.href = next || "index.html";
}

document.addEventListener("DOMContentLoaded", krInitHeaderAuth);
