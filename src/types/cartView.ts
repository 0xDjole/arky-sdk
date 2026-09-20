export interface CartViewScope {
  customerId: string;
  isCurrent(): boolean;
  assertCurrent(): void;
}
