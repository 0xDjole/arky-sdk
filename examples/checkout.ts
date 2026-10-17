import { mountCheckoutAction } from "arky-sdk/storefront";
import { store } from "./storefront-store.js";

const [catalog] = await store.eshop.catalog.find();
const checkout = store.eshop.checkoutFlow({ buyer: { type: "customer" }, catalog_id: catalog.id });

checkout.state.subscribe((state) => {
  console.log(state.step, state.quote?.blockers, state.error?.code);
});

let state = await checkout.open();
if (state.step === "details") {
  checkout.setContact("ana@example.com");
  state = await checkout.shipTo({
    type: "delivery",
    address: {
      name: "Ana",
      company: null,
      street1: "Main Street 1",
      street2: null,
      city: "Springfield",
      state: null,
      postal_code: "10001",
      country: "US",
      phone: null,
      email: "ana@example.com",
    },
  });
}
for (const delivery of state.quote?.deliveries ?? []) {
  const [offer] = delivery.offers;
  if (offer) state = await checkout.chooseShipping(delivery.delivery_group_id, { shipping_method_id: offer.shipping_method_id, rate_id: offer.rate_id });
}
if (state.step === "payment") {
  state = await checkout.place({ return_url: (orderId) => `${location.origin}/order/${orderId}` });
}
const action = state.placed?.payment_action;
if (state.step === "paying" && action && action.type !== "none") {
  await mountCheckoutAction(action, "#payment", {}, state.placed?.payment_id ?? undefined);
}

const orderId = new URLSearchParams(location.search).get("order_id");
if (orderId) {
  const resumed = await checkout.resume({ order_id: orderId, url: location.href });
  history.replaceState(history.state, "", resumed.url);
  console.log(resumed.state.outcome);
}
