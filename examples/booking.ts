import { findBlock, formatPrice, getBlockTextValue } from "arky-sdk/storefront";
import { arky, buyer, catalog } from "./setup.js";

const { items: services } = await arky.eshop.bookingService.find({ catalog_id: catalog.id, include_price: true, limit: 20 });
console.log(services.map((service) => ({ name: getBlockTextValue(findBlock(service, "name"), "en"), price: formatPrice(service.price, "en") })));

const calendar = arky.eshop.bookingCalendar({ buyer, catalog_id: catalog.id });
calendar.state.subscribe((state) => console.log(state.loading, state.days.length, state.slots.length));

const [service] = services;
if (service) {
  await calendar.select({ booking_service_id: service.id });
  const day = calendar.state.get().days.find((cell) => cell.available);
  if (!day) await calendar.nextMonth();
  calendar.selectFirstAvailableDate();
  const [slot] = calendar.state.get().slots;
  if (slot) {
    calendar.selectSlot({ slot });
    console.log(slot.date_text, slot.time_text, slot.is_multi_day);
    await calendar.addToCart({ slot });
  }
}

const checkout = arky.eshop.checkoutFlow({ buyer, catalog_id: catalog.id });
console.log(checkout.cart === arky.eshop.cart({ buyer, catalog_id: catalog.id }), checkout.cart.booking_items.get().length);
