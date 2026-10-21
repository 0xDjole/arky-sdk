import { CheckoutFlowError, mountCheckoutAction, MonriCheckoutError } from "arky-sdk/storefront";
import { arky, buyer, catalog } from "./setup.js";

const checkout = arky.eshop.checkoutFlow({ buyer, catalog_id: catalog.id });

checkout.state.subscribe((state) => {
  console.log(state.step, state.quote?.blockers, state.error?.code);
});

let state = await checkout.open();
checkout.setContact({ contact_email: { email: "ana@example.com", language: "en" } });
state = await checkout.shipTo({
  destination: {
    type: "delivery",
    address: {
      name: "Ana",
      company: null,
      street1: "Main Street 1",
      street2: null,
      city: "Zagreb",
      state: null,
      postal_code: "10000",
      country: "HR",
      phone: "+385 1 234 567",
      email: "ana@example.com",
    },
  },
});

for (const delivery of state.quote?.deliveries ?? []) {
  const [offer] = delivery.offers;
  if (offer) {
    state = await checkout.selectShipping({
      delivery_group_id: delivery.delivery_group_id,
      shipping_method_id: offer.shipping_method_id,
      rate_id: offer.rate_id,
    });
  }
}

const [option] = state.quote?.payment_option_ids ?? [];
if (option) checkout.selectPaymentOption({ payment_option_id: option });

if (state.step === "payment") {
  try {
    state = await checkout.place({ return_url: (orderId) => `${location.origin}/order/${orderId}` });
  } catch (error) {
    if (error instanceof CheckoutFlowError && error.code === "presentation_changed") {
      console.log("the quote changed; show the new total", checkout.state.get().quote?.totals.total);
    }
    throw error;
  }
}

const placed = state.placed;
if (placed && placed.payment_action.type !== "none") {
  const mount = await mountCheckoutAction({
    action: placed.payment_action,
    payment_id: placed.payment_id,
    element: "#payment",
    onComplete: () => checkout.refreshPayment().then((next) => console.log(next.outcome)),
    onValidationError: (error) => console.log(error ? error.code : "card details look fine"),
  });

  if (mount?.type === "monri_components") {
    const payButton = document.querySelector<HTMLButtonElement>("#pay");
    payButton?.addEventListener("click", async () => {
      try {
        await mount.confirm({
          full_name: "Ana Horvat",
          address: "Main Street 1",
          city: "Zagreb",
          zip: "10000",
          phone: "+385 1 234 567",
          country: "HR",
          email: "ana@example.com",
        });
      } catch (error) {
        if (error instanceof MonriCheckoutError && error.code === "invalid_details") console.log("let the buyer fix the form");
        else if (error instanceof MonriCheckoutError && error.code === "unknown_result") console.log("we'll email you once the payment is checked");
        else throw error;
      }
    });
  }
}
