import { createAdmin } from "../../dist/admin.js";

export const baseUrl = "https://api.example.test";
export const storeId = "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19";

export function admin() {
  return createAdmin({
    baseUrl,
    apiToken: "scheduled-contract-token",
  });
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
