import assert from "node:assert/strict";
import test from "node:test";

import * as inventoryUtils from "../dist/utils.js";

test("ProductInventory derives free-to-sell stock from on_hand minus reserved", () => {
  const variant = {
    inventory: [
      {
        store_location_id: "location-a",
        on_hand: 10,
        reserved: 4,
      },
      {
        store_location_id: "location-b",
        on_hand: 3,
        reserved: 1,
      },
    ],
  };

  assert.equal(inventoryUtils.getFreeToSellStock(variant), 8);
  assert.equal(inventoryUtils.getReservedStock(variant), 5);
  assert.equal(inventoryUtils.hasStock(variant, 8), true);
  assert.equal(inventoryUtils.hasStock(variant, 9), false);
  assert.equal(
    inventoryUtils.getInventoryAt(variant, "location-b"),
    variant.inventory[1],
  );
  assert.equal(
    inventoryUtils.getFirstAvailableStoreLocationId(variant, 3),
    "location-a",
  );
});

test("ProductInventory utilities fail closed when reserved exceeds on_hand", () => {
  const invalid = {
    inventory: [
      {
        store_location_id: "location-invalid",
        on_hand: 2,
        reserved: 3,
      },
    ],
  };

  assert.throws(
    () => inventoryUtils.getFreeToSellStock(invalid),
    /reserved <= on_hand/,
  );
  assert.throws(
    () => inventoryUtils.getReservedStock(invalid),
    /reserved <= on_hand/,
  );
  assert.throws(
    () => inventoryUtils.getFirstAvailableStoreLocationId(invalid),
    /reserved <= on_hand/,
  );
  assert.equal("getAvailableStock" in inventoryUtils, false);
  assert.equal("getFirstAvailableFCId" in inventoryUtils, false);
});
