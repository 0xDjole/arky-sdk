export function checkoutSources(cartId, type = "product", lineId = "3e956b8d-efc3-42e6-a5c1-9fb38ea840fa", quantity = 1) {
  return {
    cart: { cart_id: cartId, version: "reviewed-version" },
    converted_lines: [{
      cart_line_item: { type, line_item_id: lineId },
      cart_units: { first_unit: 0, quantity },
      order_line_item: { type, line_item_id: lineId },
      order_units: { first_unit: 0, quantity },
    }],
  };
}
