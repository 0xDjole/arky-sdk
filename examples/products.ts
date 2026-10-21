import { findBlock, formatMinor, formatPrice, getBlockTextValue, getImageUrl } from "arky-sdk/storefront";
import type { CatalogListing, Media } from "arky-sdk/storefront";
import { arky, catalog } from "./setup.js";

const page = await arky.eshop.catalogItem.find({
  catalog_id: catalog.id,
  include_price: true,
  selection: { types: ["product"], text: "coffee", sort: "relevance" },
  limit: 24,
});

const imageIds = page.items.flatMap((listing) => {
  const image = findBlock(listing.content, "image");
  return image?.type === "media" && image.value ? [image.value] : [];
});
const { items: images } = await arky.media.find({ ids: imageIds });
const imageById = new Map<string, Media>(images.map((image) => [image.id, image]));

function startingPrice(listing: CatalogListing): string {
  const summary = listing.price_summary;
  return summary?.type === "comparable" && listing.currency ? formatMinor(summary.min_amount, listing.currency, "en") : "";
}

function card(listing: CatalogListing) {
  const image = findBlock(listing.content, "image");
  return {
    name: getBlockTextValue(findBlock(listing.content, "name"), "en"),
    image: image?.type === "media" && image.value ? getImageUrl(imageById.get(image.value), "medium") : null,
    price: startingPrice(listing),
    href: `/products/${listing.content.slugs.en}`,
  };
}

console.log(page.items.map(card), page.cursor);

const product = await arky.eshop.product.get({ slug: "classic", catalog_id: catalog.id });
const { items: choices } = await arky.eshop.catalogItem.findPrices({
  catalog_item_id: product.catalog_item_id,
  catalog_id: catalog.id,
  include_price: true,
});
console.log(
  getBlockTextValue(findBlock(product, "name"), "en"),
  choices.map((choice) => ({
    catalog_item_price_id: choice.catalog_item_price_id,
    sku: choice.content.sku,
    size: getBlockTextValue(findBlock(choice.content, "size"), "en"),
    price: formatPrice(choice.price, "en"),
  })),
);
