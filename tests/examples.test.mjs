import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const exampleDirectory = new URL("../examples/", import.meta.url);
const examplePaths = readdirSync(exampleDirectory)
  .filter((name) => name.endsWith(".ts"))
  .sort()
  .map((name) => fileURLToPath(new URL(name, exampleDirectory)));

test("the five published examples compile against the built SDK", () => {
  assert.deepEqual(
    examplePaths.map((path) => path.split("/").at(-1)),
    ["checkout.ts", "errors.ts", "installation.ts", "quick-start.ts", "storefront-store.ts"],
  );
  const program = ts.createProgram({
    rootNames: examplePaths,
    options: {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.deepEqual(
    diagnostics.map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (!diagnostic.file || diagnostic.start === undefined) return message;
      const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} ${message}`;
    }),
    [],
  );
});
