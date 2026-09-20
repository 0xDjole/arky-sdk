import type { FindStorefrontProductVariantsParams, GetStorefrontProductVariantParams, StorefrontProduct, StorefrontPrice } from "arky-sdk";
import type { FindStorefrontProductVariantsParams as PublicFind, GetStorefrontProductVariantParams as PublicGet } from "arky-sdk/types";
import { createStorefront } from "arky-sdk/storefront";
declare const client: ReturnType<typeof createStorefront>;
declare const product: StorefrontProduct;
const price: StorefrontPrice | null = product.price;
const canPurchase: boolean = product.purchase_allowed;
declare const find: FindStorefrontProductVariantsParams;
declare const get: GetStorefrontProductVariantParams;
const publicFind: PublicFind = find;
const publicGet: PublicGet = get;
void client.eshop.productVariant.find(publicFind);
void client.eshop.productVariant.get(publicGet);
// @ts-expect-error Independent variant pages are not embedded in Product cards.
product.variants;
// @ts-expect-error Storefront reads never accept Store routing overrides.
client.eshop.productVariant.find({ product_id: "product", store_id: "store" });
// @ts-expect-error Public stock is not a per-Product aggregate resource.
client.eshop.product.getInventory({ id: "product" });
void price;
void canPurchase;
