import { findBlock, formatPrice, getBlockTextValue } from "arky-sdk/storefront";
import { arky, buyer, shopPackage } from "./setup.js";

const { items } = await arky.eshop.packageItem.find({
  package_id: shopPackage.id,
  selection: { types: ["booking_service"] },
  limit: 20,
});
console.log(items.map((item) => getBlockTextValue(findBlock(item.content, "name"), "en")));

const calendar = arky.eshop.bookingCalendar({ buyer, package_id: shopPackage.id });
calendar.state.subscribe((state) => console.log(state.loading, state.days.length, state.slots.length));

const [service] = items;
if (service?.item.type === "booking_service") {
  await calendar.select({ booking_service_id: service.item.booking_service_id });
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

const checkout = arky.eshop.checkoutFlow({ buyer, package_id: shopPackage.id });
console.log(checkout.cart === arky.eshop.cart({ buyer, package_id: shopPackage.id }), checkout.cart.booking_items.get().length);
