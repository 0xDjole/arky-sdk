import { ArkyApiError } from "arky-sdk/storefront";
import { arky } from "./setup.js";

arky.session.subscribe((session) => {
  console.log(session?.type === "email_authenticated" ? `signed in as ${session.customer.id}` : "visitor");
});

await arky.customer.requestCode({ contact: { email: "ana@example.com", language: "en" } });

const signedIn = await arky.customer.verify({ code: "123456" }).then(
  () => true,
  (error: unknown) => {
    if (error instanceof ArkyApiError && (error.code === "CUSTOMER_SIGN_IN.CODE_INVALID" || error.code === "CUSTOMER_SIGN_IN.ATTEMPTS_EXHAUSTED")) {
      console.log("show the CMS text for", error.code);
      return false;
    }
    throw error;
  },
);

if (signedIn) {
  const me = await arky.customer.getMe();
  if (me) {
    await arky.customer.updateMe({
      expected_updated_at: me.customer.updated_at,
      profile: [{ id: crypto.randomUUID(), key: "first_name", type: "text", value: "Ana" }],
    });
  }

  const { items: orders } = await arky.eshop.order.find({ limit: 20 });
  console.log(orders.map((order) => order.number));

  const signedOut = await arky.customer.logout();
  if (signedOut.type === "unconfirmed") console.log("show the CMS text for a sign-out Arky didn't confirm");
}
