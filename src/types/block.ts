import type { CalendarDate, EpochMilliseconds } from "./time";
import type { Coordinates, LocalizedMarkdown, LocalizedText } from "./common";

export interface BlockBase {
  id: string;
  key: string;
}

export interface TextBlock extends BlockBase {
  type: "text";
  value: string | null;
}

export interface LocalizedTextBlock extends BlockBase {
  type: "localized_text";
  value: LocalizedText | null;
}

export interface MarkdownBlock extends BlockBase {
  type: "markdown";
  value: string | null;
}

export interface LocalizedMarkdownBlock extends BlockBase {
  type: "localized_markdown";
  value: LocalizedMarkdown | null;
}

export interface NumberBlock extends BlockBase {
  type: "number";
  value: number | null;
}

export interface BooleanBlock extends BlockBase {
  type: "boolean";
  value: boolean | null;
}

export interface DateBlock extends BlockBase {
  type: "date";
  value: CalendarDate | null;
}

export interface DateTimeBlock extends BlockBase {
  type: "date_time";
  value: EpochMilliseconds | null;
}

export interface GeoLocationBlock extends BlockBase {
  type: "geo_location";
  value: Coordinates | null;
}

export interface MediaBlock extends BlockBase {
  type: "media";
  value: string | null;
}

export interface EntryBlock extends BlockBase {
  type: "entry";
  value: string | null;
}

export interface FormBlock extends BlockBase {
  type: "form";
  value: string | null;
}

export interface ProductBlock extends BlockBase {
  type: "product";
  value: string | null;
}

export interface ArrayBlock extends BlockBase {
  type: "array";
  value: Block[];
}

export interface ObjectBlock extends BlockBase {
  type: "object";
  value: Block[];
}

export type Block =
  | TextBlock
  | LocalizedTextBlock
  | MarkdownBlock
  | LocalizedMarkdownBlock
  | NumberBlock
  | BooleanBlock
  | DateBlock
  | DateTimeBlock
  | GeoLocationBlock
  | MediaBlock
  | EntryBlock
  | FormBlock
  | ProductBlock
  | ArrayBlock
  | ObjectBlock;

export type BlockType = Block["type"];

export type CollectionFilter =
  | { type: "all" }
  | { type: "only"; collection_ids: string[] };

export interface BlockSchema {
  id: string;
  key: string;
  type: BlockSchemaType;
}

export type BlockSchemaType =
  | {
      type: "text";
      required: boolean;
      min_length: number | null;
      max_length: number | null;
      pattern: string | null;
    }
  | { type: "localized_text"; required: boolean }
  | {
      type: "markdown";
      required: boolean;
      min_length: number | null;
      max_length: number | null;
      pattern: string | null;
    }
  | { type: "localized_markdown"; required: boolean }
  | { type: "number"; required: boolean; min: number | null; max: number | null }
  | { type: "boolean"; required: boolean }
  | { type: "date"; required: boolean }
  | { type: "date_time"; required: boolean }
  | { type: "geo_location"; required: boolean }
  | { type: "media"; required: boolean }
  | { type: "entry"; required: boolean; collections: CollectionFilter }
  | { type: "form"; required: boolean }
  | { type: "product"; required: boolean }
  | {
      type: "array";
      items: BlockSchema[];
      min_items: number | null;
      max_items: number | null;
    }
  | {
      type: "object";
      fields: BlockSchema[];
      min_fields: number | null;
      max_fields: number | null;
    };

export type BlockSchemaKind = BlockSchemaType["type"];

export type BlockQueryOperation =
  | "equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal";

export type BlockQuery =
  | { type: "text"; key: string; values: string[] }
  | { type: "localized_text"; key: string; locale: string; values: string[] }
  | { type: "number"; key: string; operation: BlockQueryOperation; value: number }
  | { type: "boolean"; key: string; value: boolean }
  | { type: "date"; key: string; operation: BlockQueryOperation; value: CalendarDate }
  | { type: "date_time"; key: string; operation: BlockQueryOperation; value: EpochMilliseconds };
