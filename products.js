/* ==========================================================
   KashRun — Products
   ========================================================== */

function krProductImageUrl(path) {
  if (!path) return "assets/logo.png";
  if (path.startsWith("http")) return path;
  const { data } = sb.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

async function krFetchCategories() {
  const { data, error } = await sb
    .from("categories")
    .select("id, name, slug, icon")
    .order("name", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

/**
 * Fetch active products with optional filters.
 * opts: { search, categoryId, minPrice, maxPrice, sort, limit, offset }
 */
async function krFetchProducts(opts = {}) {
  let q = sb
    .from("products")
    .select("id, name, description, price, compare_at_price, stock, category_id, seller_id, is_active, created_at, product_images(image_path, is_primary)")
    .eq("is_active", true);

  if (opts.search) {
    q = q.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
  }
  if (opts.categoryId) {
    q = q.eq("category_id", opts.categoryId);
  }
  if (opts.minPrice != null) q = q.gte("price", opts.minPrice);
  if (opts.maxPrice != null) q = q.lte("price", opts.maxPrice);

  switch (opts.sort) {
    case "price_asc":
      q = q.order("price", { ascending: true });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false });
      break;
    case "newest":
    default:
      q = q.order("created_at", { ascending: false });
  }

  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function krFetchProductById(id) {
  const { data, error } = await sb
    .from("products")
    .select("*, product_images(id, image_path, is_primary), sellers(shop_name), categories(name, slug)")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

async function krFetchRelatedProducts(categoryId, excludeId, limit = 6) {
  const { data, error } = await sb
    .from("products")
    .select("id, name, price, compare_at_price, product_images(image_path, is_primary)")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(limit);
  if (error) return [];
  return data || [];
}

async function krFetchProductReviews(productId) {
  const { data, error } = await sb
    .from("reviews")
    .select("id, rating, comment, created_at, profiles(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

function krPrimaryImage(product) {
  const images = product.product_images || [];
  const primary = images.find((i) => i.is_primary) || images[0];
  return krProductImageUrl(primary ? primary.image_path : null);
}

/* ---------- Render a product card (used on home/listing/search/related) ---------- */
function krRenderProductCard(p) {
  const img = krPrimaryImage(p);
  const wishActive = krWishlistHas ? krWishlistHas(p.id) : false;
  const compare = p.compare_at_price && p.compare_at_price > p.price
    ? `<span class="strike">${krFormatPrice(p.compare_at_price)}</span>`
    : "";
  return `
    <div class="prod-card" data-id="${p.id}">
      <a href="product.html?id=${p.id}" class="prod-thumb">
        <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='assets/logo.png'">
      </a>
      <button class="prod-wish ${wishActive ? "active" : ""}" data-wish="${p.id}" aria-label="Toggle wishlist">♥</button>
      <div class="prod-body">
        <a href="product.html?id=${p.id}"><p class="prod-name">${p.name}</p></a>
        <div class="prod-price">${krFormatPrice(p.price)} ${compare}</div>
        <button class="btn btn-primary btn-sm prod-add" data-add="${p.id}">Add to Cart</button>
      </div>
    </div>`;
}

function krWireProductGridEvents(container) {
  container.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      await krCartAdd(btn.getAttribute("data-add"), 1);
      krToast("Added to cart");
    });
  });
  container.querySelectorAll("[data-wish]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.getAttribute("data-wish");
      krWishlistToggle(id);
      btn.classList.toggle("active");
    });
  });
}
