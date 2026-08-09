/* ==========================================================
   KashRun — Cart
   Guests: cart lives in localStorage so browsing/adding to
   cart never requires an account.
   Logged in: cart lives in Supabase `cart_items`, so it's
   available across devices. On login, the guest cart is
   merged into cart_items automatically (see krCartMergeOnLogin).
   ========================================================== */

const KR_GUEST_CART_KEY = "kr_guest_cart"; // [{product_id, quantity}]

function krGuestCartRead() {
  try {
    return JSON.parse(localStorage.getItem(KR_GUEST_CART_KEY)) || [];
  } catch {
    return [];
  }
}
function krGuestCartWrite(items) {
  localStorage.setItem(KR_GUEST_CART_KEY, JSON.stringify(items));
}

async function krCartAdd(productId, quantity = 1) {
  const user = await krGetUser();
  if (user) {
    const { data: existing } = await sb
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();
    if (existing) {
      await sb.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
    } else {
      await sb.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity });
    }
  } else {
    const items = krGuestCartRead();
    const found = items.find((i) => i.product_id === productId);
    if (found) found.quantity += quantity;
    else items.push({ product_id: productId, quantity });
    krGuestCartWrite(items);
  }
  krCartBadgeUpdate();
}

async function krCartSetQty(productIdOrRowId, quantity, isRowId = false) {
  const user = await krGetUser();
  if (user) {
    if (quantity <= 0) {
      await sb.from("cart_items").delete().eq(isRowId ? "id" : "product_id", productIdOrRowId).eq("user_id", user.id);
    } else {
      await sb.from("cart_items").update({ quantity }).eq(isRowId ? "id" : "product_id", productIdOrRowId).eq("user_id", user.id);
    }
  } else {
    let items = krGuestCartRead();
    if (quantity <= 0) items = items.filter((i) => i.product_id !== productIdOrRowId);
    else {
      const found = items.find((i) => i.product_id === productIdOrRowId);
      if (found) found.quantity = quantity;
    }
    krGuestCartWrite(items);
  }
  krCartBadgeUpdate();
}

async function krCartRemove(productIdOrRowId, isRowId = false) {
  await krCartSetQty(productIdOrRowId, 0, isRowId);
}

/** Returns [{ id (row id or null), product_id, quantity, product:{...} }] */
async function krCartFetchDetailed() {
  const user = await krGetUser();
  if (user) {
    const { data, error } = await sb
      .from("cart_items")
      .select("id, quantity, product_id, products(id, name, price, stock, is_active, product_images(image_path, is_primary))")
      .eq("user_id", user.id);
    if (error) {
      console.error(error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      product: row.products,
    }));
  }
  const items = krGuestCartRead();
  if (items.length === 0) return [];
  const ids = items.map((i) => i.product_id);
  const { data, error } = await sb
    .from("products")
    .select("id, name, price, stock, is_active, product_images(image_path, is_primary)")
    .in("id", ids);
  if (error) return [];
  return items.map((i) => ({
    id: null,
    product_id: i.product_id,
    quantity: i.quantity,
    product: (data || []).find((p) => p.id === i.product_id),
  }));
}

async function krCartCount() {
  const user = await krGetUser();
  if (user) {
    const { count } = await sb.from("cart_items").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    return count || 0;
  }
  return krGuestCartRead().reduce((sum, i) => sum + i.quantity, 0);
}

async function krCartBadgeUpdate() {
  const badge = document.querySelector("[data-cart-count]");
  if (!badge) return;
  const count = await krCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

/** Called right after a successful login so the guest cart isn't lost. */
async function krCartMergeOnLogin(userId) {
  const guestItems = krGuestCartRead();
  if (guestItems.length === 0) return;
  for (const item of guestItems) {
    const { data: existing } = await sb
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", item.product_id)
      .maybeSingle();
    if (existing) {
      await sb.from("cart_items").update({ quantity: existing.quantity + item.quantity }).eq("id", existing.id);
    } else {
      await sb.from("cart_items").insert({ user_id: userId, product_id: item.product_id, quantity: item.quantity });
    }
  }
  localStorage.removeItem(KR_GUEST_CART_KEY);
}

document.addEventListener("DOMContentLoaded", krCartBadgeUpdate);
