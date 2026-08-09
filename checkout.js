/* ==========================================================
   KashRun — Checkout
   PIN serviceability is checked live for UX, but the final
   guard against creating an order for an unserviceable PIN
   lives in the `place_order` Postgres function (see
   sql/place_order.sql) — never trust JS alone for that.
   ========================================================== */

async function krCheckPincode(pincode) {
  if (!/^\d{6}$/.test(pincode)) return { valid: false, reason: "format" };
  const { data, error } = await sb
    .from("serviceable_pincodes")
    .select("pincode, district, area, is_active")
    .eq("pincode", pincode)
    .maybeSingle();
  if (error) {
    console.error(error);
    return { valid: false, reason: "error" };
  }
  if (!data || !data.is_active) return { valid: false, reason: "unserviceable" };
  return { valid: true, info: data };
}

async function krSaveAddress(address) {
  const user = await krGetUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("addresses")
    .insert({ ...address, user_id: user.id })
    .select()
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

async function krFetchAddresses() {
  const user = await krGetUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

/**
 * Places the order via the secure RPC. Throws on failure with a
 * friendly `.friendly` message attached.
 */
async function krPlaceOrder({ address, paymentMethod, items }) {
  const payload = items.map((i) => ({
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.product.price,
  }));

  const { data, error } = await sb.rpc("place_order", {
    p_address: address,
    p_payment_method: paymentMethod,
    p_items: payload,
  });

  if (error) {
    const msg = (error.message || "").toUpperCase();
    if (msg.includes("PIN_NOT_SERVICEABLE")) {
      error.friendly = "Sorry, KashRun delivery is currently unavailable at this PIN code.";
    } else if (msg.includes("AUTH_REQUIRED")) {
      error.friendly = "Please log in to place your order.";
    } else if (msg.includes("EMPTY_CART")) {
      error.friendly = "Your cart is empty.";
    } else {
      error.friendly = krFriendlyError(error);
    }
    throw error;
  }

  // Clear the guest cart too, in case it lingered.
  localStorage.removeItem(KR_GUEST_CART_KEY);
  return data; // order id
}
