/* ==========================================================
   KashRun — Orders
   ========================================================== */

async function krFetchOrders() {
  const user = await krGetUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("orders")
    .select("id, created_at, status, total_amount, payment_method")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function krFetchOrderDetails(orderId) {
  const user = await krGetUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("orders")
    .select("*, order_items(id, quantity, price, products(id, name, product_images(image_path, is_primary)))")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

const KR_STATUS_LABEL = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const KR_STATUS_SEQUENCE = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

function krStatusBadge(status) {
  return `<span class="status-badge status-${status}">${KR_STATUS_LABEL[status] || status}</span>`;
}
