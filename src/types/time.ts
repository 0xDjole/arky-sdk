declare const epochMillisecondsBrand: unique symbol;

export type EpochMilliseconds = number & {
  readonly [epochMillisecondsBrand]: "EpochMilliseconds";
};

export type CalendarDate = string;

export type CalendarMonth = string;

export type Duration = number;

export type Days = number;

export type BusinessDays = number;
