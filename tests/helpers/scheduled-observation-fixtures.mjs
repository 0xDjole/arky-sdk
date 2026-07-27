import { createAdmin } from "../../dist/admin.js";

export const baseUrl = "https://api.example.test";
export const storeId = "store-scheduled";

export function admin() {
  return createAdmin({
    baseUrl,
    storeId,
    apiToken: "scheduled-contract-token",
  });
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
