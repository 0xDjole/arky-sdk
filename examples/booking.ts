import { findBlock, formatPrice, getBlockTextValue } from "arky-sdk/storefront";
import { arky, buyer, catalog } from "./setup.js";

const { items: listings } = await arky.eshop.catalogItem.find({
  catalog_id: catalog.id,
  selection: { types: ["booking_service"] },
  limit: 20,
});
console.log(listings.map((listing) => getBlockTextValue(findBlock(listing.content, "name"), "en")));

const calendar = arky.eshop.bookingCalendar({ buyer, catalog_id: catalog.id });
calendar.state.subscribe((state) => console.log(state.loading, state.days.length, state.slots.length));

const [listing] = listings;
if (listing?.item.type === "booking_service") {
  await calendar.select({ booking_service_id: listing.item.booking_service_id });
  const day = calendar.state.get().days.find((cell) => cell.available);
  if (!day) await calendar.nextMonth();
  calendar.selectFirstAvailableDate();
  const [slot] = calendar.state.get().slots;
  if (slot) {
    calendar.selectSlot({ slot });
    console.log(slot.date_text, slot.time_text, slot.is_multi_day, formatPrice(slot.price, "en"));
    await calendar.addToCart({ slot });
  }
}

const checkout = arky.eshop.checkoutFlow({ buyer, catalog_id: catalog.id });
console.log(checkout.cart === arky.eshop.cart({ buyer, catalog_id: catalog.id }), checkout.cart.booking_items.get().length);
