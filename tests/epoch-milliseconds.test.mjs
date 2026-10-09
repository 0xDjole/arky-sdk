import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
  epochMilliseconds,
  epochMillisecondsFromDate,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "arky-sdk";
import * as utilities from "arky-sdk/utils";

const require = createRequire(import.meta.url);
const knownInstant = 1_704_164_645_678;
const dateLimit = 8_640_000_000_000_000;

test("checked instants preserve signed safe integers without guessing units", () => {
  for (const value of [
    Number.MIN_SAFE_INTEGER,
    -knownInstant,
    -1,
    0,
    1,
    1_700_000_000,
    knownInstant,
    Number.MAX_SAFE_INTEGER,
  ]) {
    const instant = epochMilliseconds(value);
    assert.equal(instant, value);
    assert.equal(typeof instant, "number");
    assert.equal(JSON.parse(JSON.stringify(instant)), value);
  }
  assert.equal(
    epochMillisecondsToDate(epochMilliseconds(1_700_000_000)).toISOString(),
    "1970-01-20T16:13:20.000Z",
  );
});

test("checked instants reject fractions, nonfinite and unsafe values without coercion", () => {
  for (const value of [
    0.1,
    -0.1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
    Number.MIN_SAFE_INTEGER - 1,
    "1704164645678",
    null,
    undefined,
    true,
    1n,
  ]) {
    assert.throws(() => epochMilliseconds(value), RangeError);
  }
});

test("explicit Date conversions preserve exact milliseconds and calendar output", () => {
  const date = new Date("2024-01-02T03:04:05.678Z");
  assert.equal(epochMillisecondsFromDate(date), knownInstant);
  assert.equal(epochMillisecondsToDate(epochMilliseconds(knownInstant)).toISOString(), date.toISOString());
  for (const value of [-dateLimit, -1, 0, 1, knownInstant, dateLimit]) {
    assert.equal(
      epochMillisecondsFromDate(epochMillisecondsToDate(epochMilliseconds(value))),
      value,
    );
  }
  const first = epochMillisecondsToDate(epochMilliseconds(knownInstant));
  const second = epochMillisecondsToDate(epochMilliseconds(knownInstant));
  first.setTime(0);
  assert.equal(second.getTime(), knownInstant);
});

test("Date adapters reject invalid Dates and unsupported Date ranges", () => {
  assert.throws(() => epochMillisecondsFromDate(new Date(Number.NaN)), RangeError);
  for (const value of [-dateLimit - 1, dateLimit + 1, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]) {
    const instant = epochMilliseconds(value);
    assert.throws(() => epochMillisecondsToDate(instant), RangeError);
  }
  for (const value of [Number.NaN, 0.5, "1704164645678"]) {
    assert.throws(() => epochMillisecondsToDate(value), RangeError);
  }
});

test("now uses the current wall-clock millisecond value without scaling", (context) => {
  context.mock.method(Date, "now", () => knownInstant);
  assert.equal(epochMillisecondsNow(), knownInstant);
});

test("published root and utilities surfaces expose checked helpers in ESM and CommonJS", () => {
  for (const surface of [utilities, require("arky-sdk"), require("arky-sdk/utils")]) {
    assert.equal(surface.epochMilliseconds(knownInstant), knownInstant);
    assert.equal(surface.epochMillisecondsFromDate(new Date(knownInstant)), knownInstant);
    assert.equal(surface.epochMillisecondsToDate(surface.epochMilliseconds(knownInstant)).getTime(), knownInstant);
    assert.equal(typeof surface.epochMillisecondsNow, "function");
    assert.throws(() => surface.epochMilliseconds(0.5), RangeError);
  }
});

test("published timestamp declarations share one brand and reject unchecked values", () => {
  const program = ts.createProgram({
    rootNames: [fileURLToPath(new URL("./fixtures/epoch-milliseconds.ts", import.meta.url))],
    options: {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
    },
  });
  assert.deepEqual(
    ts.getPreEmitDiagnostics(program).map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (!diagnostic.file || diagnostic.start === undefined) return message;
      const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} ${message}`;
    }),
    [],
  );
});
