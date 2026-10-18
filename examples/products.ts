import { findBlock, formatPrice, getBlockTextValue, getImageUrl } from "arky-sdk/storefront";
import type { Media, StorefrontProduct } from "arky-sdk/storefront";
import { arky, catalog } from "./setup.js";

const page = await arky.eshop.product.find({ catalog_id: catalog.id, include_price: true, limit: 24 });

const imageIds = page.items.flatMap((product) => {
  const image = findBlock(product, "image");
  return image?.type === "media" && image.value ? [image.value] : [];
});
const { items: images } = await arky.media.find({ ids: imageIds });
const imageById = new Map<string, Media>(images.map((image) => [image.id, image]));

function card(product: StorefrontProduct) {
  const image = findBlock(product, "image");
  return {
    name: getBlockTextValue(findBlock(product, "name"), "en"),
    image: image?.type === "media" && image.value ? getImageUrl(imageById.get(image.value), "medium") : null,
    price: formatPrice(product.price, "en"),
    href: `/products/${product.slugs.en}`,
  };
}

console.log(page.items.map(card), page.cursor);

const product = await arky.eshop.product.get({ slug: "classic", catalog_id: catalog.id, include_price: true });
const { items: variants } = await arky.eshop.productVariant.find({
  product_id: product.id,
  catalog_id: catalog.id,
  include_price: true,
});
console.log(card(product), variants.map((variant) => ({ id: variant.id, sku: variant.sku, price: formatPrice(variant.price, "en") })));
