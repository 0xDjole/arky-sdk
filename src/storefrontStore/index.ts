export { createArkyStore } from "./createArkyStore";
export type {
  ArkyCalendarDay,
  ArkyCartInput,
  ArkyCartSnapshot,
  ArkyCartStatus,
  ArkyCmsEntryParams,
  ArkyCmsState,
  ArkyEshopState,
  ArkyLastOrder,
  ArkyServiceCartItem,
  ArkyServiceSlot,
  ArkyServiceState,
  ArkyStoreContext,
  ArkyStoreConfig,
  ArkyStoreSetupOptions,
  ArkyStoreSetupResult,
} from "./types";
export type ArkyStore = ReturnType<typeof import("./createArkyStore").createArkyStore>;
export type ArkyCartStore = ArkyStore["eshop"]["cart"];
export type ArkyServiceStore = ArkyStore["eshop"]["service"];
