#!/usr/bin/env node
// Public SDK surface guardrail.
//
// Keep exported SDK names canonical. This fails on compatibility-style type
// aliases, numeric suffixes, and "old" public input names.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const removedRenameParam = new RegExp(`\\b${["o", "ldKey"].join("")}\\b`);
const declarationPattern = (kind, parts) =>
  new RegExp(`export\\s+${kind}\\s+${parts.join("")}\\b`);

const checks = [
  {
    file: "src/types/api.ts",
    patterns: [
      declarationPattern("type", ["Quote", "Item", "Input"]),
      declarationPattern("type", ["Checkout", "Item", "Input"]),
      declarationPattern("interface", ["Invite", "User", "Params"]),
      declarationPattern("interface", ["Order", "Update", "Item"]),
      declarationPattern("interface", ["Get", "Store", "Media", "Params2"]),
    ],
  },
  {
    file: "src/types/index.ts",
    patterns: [
      declarationPattern("type", ["Geo", "Location", "Value"]),
      declarationPattern("type", ["Mailbox", "Provider"]),
      declarationPattern("type", ["Campaign", "Enrollment", "Step", "Execution", "Outcome"]),
      declarationPattern("type", ["Campaign", "Enrollment", "Draft"]),
      declarationPattern("type", ["Shipping", "Address"]),
    ],
  },
  {
    file: "src/api/platform.ts",
    patterns: [removedRenameParam],
  },
];

let failures = 0;

for (const check of checks) {
  const file = resolve(root, check.file);
  const source = readFileSync(file, "utf8");

  for (const pattern of check.patterns) {
    if (pattern.test(source)) {
      console.error(`${check.file}: public surface contains forbidden pattern ${pattern}`);
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`Found ${failures} public SDK surface issue(s).`);
  process.exit(1);
}
