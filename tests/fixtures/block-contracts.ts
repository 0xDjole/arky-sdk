import type { Block, LocalizedText, LocalizedTextBlock, EntryBlockQuery } from "arky-sdk";
import type { Block as PublicBlock, LocalizedTextBlock as PublicLocalizedTextBlock, BlockSchemaType } from "arky-sdk/types";
import { selectLocalizedText } from "arky-sdk/storefront";

type AssertTrue<T extends true> = T;
export type BlockContracts = [
  AssertTrue<LocalizedTextBlock extends Block ? true : false>,
  AssertTrue<LocalizedTextBlock extends PublicBlock ? true : false>,
  AssertTrue<PublicLocalizedTextBlock extends LocalizedTextBlock ? true : false>,
  AssertTrue<{} extends Pick<LocalizedTextBlock, "value"> ? false : true>,
  AssertTrue<null extends LocalizedTextBlock["value"] ? true : false>,
  AssertTrue<"localized_text" extends BlockSchemaType ? true : false>,
];

const translations: LocalizedText = { en: "Shirt", "sr-Latn-BA": "Košulja" };
export const nameBlock: LocalizedTextBlock = { id: "name", key: "name", type: "localized_text", value: translations };
export const nameQuery: EntryBlockQuery = { type: "localized_text", key: "name", locale: "sr-Latn-BA", values: ["Košulja"] };
export const selectedName: string | null = selectLocalizedText(translations, "sr-Latn-BA", "en");

// @ts-expect-error LocalizedText values are strings, not nested Blocks.
const nested: LocalizedTextBlock = { id: "name", key: "name", type: "localized_text", value: { en: { type: "text", value: "Shirt" } } };
// @ts-expect-error A localized query requires an explicit locale.
const missingLocale: EntryBlockQuery = { type: "localized_text", key: "name", values: ["Shirt"] };
void nested;
void missingLocale;
