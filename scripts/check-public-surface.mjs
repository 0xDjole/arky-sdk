#!/usr/bin/env node
// Public SDK surface guardrail.
//
// Keep removed aliases and the legacy provider-operation abstraction out of
// source, and reject numbered exported declarations such as `SomeParams2`.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sourceDir = resolve(root, "src");

const removedIdentifiers = [
  "QuoteItemInput",
  "CheckoutItemInput",
  "InviteUserParams",
  "OrderUpdateItem",
  "GetStoreMediaParams2",
  "GeoLocationValue",
  "MailboxProvider",
  "CampaignEnrollmentStepExecutionOutcome",
  "CampaignEnrollmentDraft",
  "ShippingAddress",
  "oldKey",
];

const removedIdentifierPattern = new RegExp(
  `\\b(?:${removedIdentifiers.join("|")})\\b`,
  "g",
);
const legacyProviderOperationPattern = /provider(?:_|-)?operations?/gi;
const exportedDeclarationPattern =
  /\bexport\s+(?:declare\s+)?(?:type|interface|class|enum|function|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;

function listTypeScriptFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const metadata = statSync(path);
    if (metadata.isDirectory()) {
      files.push(...listTypeScriptFiles(path));
    } else if (entry.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

function lineNumberAt(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function report(file, source, offset, message) {
  console.error(
    `${relative(root, file)}:${lineNumberAt(source, offset)}: ${message}`,
  );
}

let failures = 0;

for (const file of listTypeScriptFiles(sourceDir)) {
  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(removedIdentifierPattern)) {
    report(file, source, match.index, `removed public name ${match[0]}`);
    failures++;
  }

  for (const match of source.matchAll(legacyProviderOperationPattern)) {
    report(
      file,
      source,
      match.index,
      `legacy provider-operation name ${match[0]}`,
    );
    failures++;
  }

  for (const match of source.matchAll(exportedDeclarationPattern)) {
    const name = match[1];
    if (!/\d$/.test(name)) continue;
    report(file, source, match.index, `numbered public declaration ${name}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`Found ${failures} public SDK surface issue(s).`);
  process.exit(1);
}
