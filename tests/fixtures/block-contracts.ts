import type { Block, BlockQuery, LocalizedMarkdownBlock, LocalizedText, LocalizedTextBlock, ObjectBlock } from "arky-sdk";
import type { Block as PublicBlock, LocalizedTextBlock as PublicLocalizedTextBlock, BlockSchemaType, BlockType } from "arky-sdk/types";
import { selectLocalizedText } from "arky-sdk/storefront";

type AssertTrue<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type LocalizedQuery = Extract<BlockQuery, { type: "localized_text" }>;
type Accepts<T, V> = V extends T ? true : false;

export type BlockContracts = [
  AssertTrue<LocalizedTextBlock extends Block ? true : false>,
  AssertTrue<LocalizedTextBlock extends PublicBlock ? true : false>,
  AssertTrue<PublicLocalizedTextBlock extends LocalizedTextBlock ? true : false>,
  AssertTrue<{} extends Pick<LocalizedTextBlock, "value"> ? false : true>,
  AssertTrue<null extends LocalizedTextBlock["value"] ? true : false>,
  AssertTrue<"localized_text" extends BlockSchemaType["type"] ? true : false>,
  AssertTrue<"localized_markdown" extends BlockType ? true : false>,
  AssertTrue<"digital_product" extends BlockType ? false : true>,
  AssertTrue<Equal<ObjectBlock["value"], Block[]>>,
  AssertTrue<Equal<LocalizedMarkdownBlock["value"], Record<string, string> | null>>,
  AssertTrue<Equal<LocalizedQuery["locale"], string>>,
  AssertTrue<{} extends Pick<LocalizedQuery, "locale"> ? false : true>,
  AssertTrue<Accepts<LocalizedTextBlock["value"], { en: { type: "text"; value: "Shirt" } }> extends false ? true : false>,
];

const translations: LocalizedText = { en: "Shirt", "sr-Latn-BA": "Košulja" };
export const nameBlock: LocalizedTextBlock = { id: "name", key: "name", type: "localized_text", value: translations };
export const nameQuery: BlockQuery = { type: "localized_text", key: "name", locale: "sr-Latn-BA", values: ["Košulja"] };
export const selectedName: string | null = selectLocalizedText(translations, "sr-Latn-BA", "en");
export const groupBlock: ObjectBlock = { id: "group", key: "group", type: "object", value: [nameBlock] };
