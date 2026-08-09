/* ==========================================================
   KashRun — Wishlist
   Implemented with localStorage (no wishlist table in the
   current schema). Swap this out for a Supabase table later
   without touching the calling pages if one gets added.
   ========================================================== */

const KR_WISHLIST_KEY = "kr_wishlist"; // array of product ids

function krWishlistRead() {
  try {
    return JSON.parse(localStorage.getItem(KR_WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}
function krWishlistWrite(ids) {
  localStorage.setItem(KR_WISHLIST_KEY, JSON.stringify(ids));
  krWishlistBadgeUpdate();
}
function krWishlistHas(productId) {
  return krWishlistRead().includes(productId);
}
function krWishlistToggle(productId) {
  const ids = krWishlistRead();
  const i = ids.indexOf(productId);
  if (i >= 0) {
    ids.splice(i, 1);
    krToast("Removed from wishlist");
  } else {
    ids.push(productId);
    krToast("Added to wishlist");
  }
  krWishlistWrite(ids);
  return ids.includes(productId);
}
function krWishlistBadgeUpdate() {
  const badge = document.querySelector("[data-wishlist-count]");
  if (!badge) return;
  const count = krWishlistRead().length;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

async function krWishlistFetchProducts() {
  const ids = krWishlistRead();
  if (ids.length === 0) return [];
  const { data, error } = await sb
    .from("products")
    .select("id, name, price, compare_at_price, is_active, product_images(image_path, is_primary)")
    .in("id", ids)
    .eq("is_active", true);
  if (error) return [];
  return data || [];
}

document.addEventListener("DOMContentLoaded", krWishlistBadgeUpdate);
