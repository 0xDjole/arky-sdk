import { formatMinor, latestPayment, paymentAmounts, paymentOutcome } from "arky-sdk/storefront";
import { arky, buyer, catalog } from "./setup.js";

const orderId = new URLSearchParams(location.search).get("order_id");

if (orderId) {
  const opened = await arky.eshop.order.fromLink({ id: orderId, url: location.href });
  history.replaceState(history.state, "", opened.url);

  const payments = await arky.eshop.order.findPayments({ order_id: opened.order.id }, { order_token: opened.order_token });
  const latest = latestPayment(payments.items);
  const outcome = latest ? paymentOutcome(latest) : null;
  const amounts = paymentAmounts(payments.items);
  console.log(opened.order.number, outcome, latest ? formatMinor(amounts.net_paid, latest.money.currency, "en") : null);

  const checkout = arky.eshop.checkoutFlow({ buyer, catalog_id: catalog.id });
  const reopened = await checkout.openOrder({ order_id: opened.order.id, url: location.href });
  if (reopened.state.outcome === "awaiting") {
    const next = await checkout.resumePayment();
    console.log(next.placed?.payment_action.type);
  }
}
