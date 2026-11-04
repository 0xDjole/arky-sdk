import { findBlock, formatMinor, formatPrice, getBlockTextValue, getImageUrl } from "arky-sdk/storefront";
import type { Media, StorefrontPackageItem } from "arky-sdk/storefront";
import { arky, shopPackage } from "./setup.js";

const page = await arky.eshop.packageItem.find({
  package_id: shopPackage.id,
  include_price: true,
  selection: { types: ["product"], text: "coffee", sort: "relevance" },
  limit: 24,
});

const imageIds = page.items.flatMap((item) => {
  const image = findBlock(item.content, "image");
  return image?.type === "media" && image.value ? [image.value] : [];
});
const { items: images } = await arky.media.find({ ids: imageIds });
const imageById = new Map<string, Media>(images.map((image) => [image.id, image]));

function startingPrice(item: StorefrontPackageItem): string {
  const summary = item.price_summary;
  return summary && item.currency ? formatMinor(summary.min_amount, item.currency, "en") : "";
}

function productRow(item: StorefrontPackageItem) {
  const image = findBlock(item.content, "image");
  return {
    name: getBlockTextValue(findBlock(item.content, "name"), "en"),
    image: image?.type === "media" && image.value ? getImageUrl(imageById.get(image.value), "medium") : null,
    price: startingPrice(item),
    href: `/products/${item.content.slugs.en}`,
  };
}

console.log(page.items.map(productRow), page.cursor);

const product = await arky.eshop.product.get({ slug: "classic", package_id: shopPackage.id });
const { items: choices } = await arky.eshop.packageItem.findPrices({
  package_item_id: product.package_item_id,
  package_id: shopPackage.id,
  include_price: true,
});
console.log(
  getBlockTextValue(findBlock(product, "name"), "en"),
  choices.map((choice) => ({
    price_id: choice.price_id,
    sku: choice.content.sku,
    size: getBlockTextValue(findBlock(choice.content, "size"), "en"),
    price: formatPrice(choice.price, "en"),
  })),
);
