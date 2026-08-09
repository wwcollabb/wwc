-- ==========================================================
-- KashRun — place_order RPC
-- Run this once in the Supabase SQL editor.
--
-- Why this exists: the checkout page must NOT rely only on
-- JavaScript to block orders to unserviceable PIN codes —
-- a user could bypass client-side checks. This function re-
-- checks serviceable_pincodes on the server before an order
-- is ever created, inside one atomic transaction.
--
-- IMPORTANT: column names below (orders.address, orders.total_amount,
-- order_items.price, serviceable_pincodes.pincode/is_active) are my
-- best guess at your schema — adjust them to match your actual
-- column names before running this.
-- ==========================================================

create or replace function place_order(
  p_address jsonb,          -- { full_name, mobile, house, area, city, district, pincode, state }
  p_payment_method text,    -- 'cod' for now
  p_items jsonb              -- [{ product_id, quantity, price }, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pincode text;
  v_serviceable boolean;
  v_order_id uuid;
  v_total numeric := 0;
  v_item jsonb;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_pincode := p_address->>'pincode';

  select exists(
    select 1 from serviceable_pincodes
    where pincode = v_pincode and is_active = true
  ) into v_serviceable;

  if not v_serviceable then
    raise exception 'PIN_NOT_SERVICEABLE';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + (v_item->>'price')::numeric * (v_item->>'quantity')::int;
  end loop;

  insert into orders (user_id, address, payment_method, status, total_amount)
  values (v_uid, p_address, p_payment_method, 'placed', v_total)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, quantity, price)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric
    );
  end loop;

  delete from cart_items where user_id = v_uid;

  return v_order_id;
end;
$$;

grant execute on function place_order(jsonb, text, jsonb) to authenticated;
