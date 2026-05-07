#!/usr/bin/env node
// Drift-prevention guardrail for the SDK.
//
// Walks `src/api/*.ts` and fails if it finds:
//   1. Type annotations using `: any` (outside comments)
//   2. `as any` assertions (outside comments)
//   3. Hardcoded market literals like `market: "booking"` or `market: 'eshop'`
//      (the SDK should always inject `market: apiConfig.market`)
//
// Exit code 1 if any violation is found, 0 otherwise.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(__dirname, "..", "src", "api");

const ANY_RE = /(:\s*any\b|\bas\s+any\b)/;
const MARKET_LITERAL_RE = /\bmarket\s*:\s*["'][^"']+["']/;

function listTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listTsFiles(full));
    } else if (entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function checkFile(file) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");

  const violations = { any: [], market: [] };
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    let line = raw;

    // Strip block-comment regions from the line for matching purposes.
    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    while (true) {
      const start = line.indexOf("/*");
      if (start === -1) break;
      const end = line.indexOf("*/", start + 2);
      if (end === -1) {
        line = line.slice(0, start);
        inBlockComment = true;
        break;
      }
      line = line.slice(0, start) + line.slice(end + 2);
    }

    // Strip line comment.
    const lineCommentIdx = line.indexOf("//");
    if (lineCommentIdx !== -1) {
      line = line.slice(0, lineCommentIdx);
    }

    if (line.trim().length === 0) continue;

    if (ANY_RE.test(line)) {
      violations.any.push({ file, line: i + 1, text: raw.trim() });
    }
    if (MARKET_LITERAL_RE.test(line)) {
      violations.market.push({ file, line: i + 1, text: raw.trim() });
    }
  }

  return violations;
}

function main() {
  const files = listTsFiles(apiDir);
  let anyCount = 0;
  let marketCount = 0;

  for (const file of files) {
    const v = checkFile(file);
    for (const hit of v.any) {
      console.error(`${hit.file}:${hit.line}: ${hit.text}`);
      anyCount++;
    }
    for (const hit of v.market) {
      console.error(`${hit.file}:${hit.line}: hardcoded market literal: ${hit.text}`);
      marketCount++;
    }
  }

  const total = anyCount + marketCount;
  console.error(
    `Found ${anyCount} ': any' / 'as any' violations and ${marketCount} hardcoded market literals across ${files.length} files.`,
  );

  if (total > 0) {
    console.error("Use proper types and inject `market: apiConfig.market` instead of hardcoding.");
    process.exit(1);
  }
}

main();
