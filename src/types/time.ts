declare const epochMillisecondsBrand: unique symbol;

export type EpochMilliseconds = number & {
  readonly [epochMillisecondsBrand]: "EpochMilliseconds";
};
