import { ArkyApiError } from "arky-sdk/storefront";
import { arky } from "./setup.js";

arky.session.subscribe((session) => {
  console.log(session?.type === "email_authenticated" ? `signed in as ${session.customer.id}` : "visitor");
});

const { bot_check } = await arky.getSetup();
const bot_check_token = bot_check.type === "off" ? undefined : "token-from-the-provider-widget";

await arky.customer.requestCode({ email: "ana@example.com", language: "en", bot_check_token });

try {
  await arky.customer.verify({ code: "123456" });
} catch (error) {
  if (error instanceof ArkyApiError && error.statusCode === 400) console.log("the code is wrong or expired", error.code);
  else throw error;
}

const me = await arky.customer.getMe();
await arky.customer.updateMe({
  expected_updated_at: me.customer.updated_at,
  profile: [{ id: crypto.randomUUID(), key: "first_name", type: "text", value: "Ana" }],
});

const { items: orders } = await arky.eshop.order.find({ limit: 20 });
console.log(orders.map((order) => order.number));

await arky.customer.logout();
