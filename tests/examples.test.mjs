import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const exampleDirectory = new URL("../examples/", import.meta.url);
const examplePaths = readdirSync(exampleDirectory)
  .filter((name) => name.endsWith(".ts"))
  .sort()
  .map((name) => fileURLToPath(new URL(name, exampleDirectory)));

const compilerOptions = {
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  noEmit: true,
  skipLibCheck: true,
  strict: true,
  target: ts.ScriptTarget.ES2022,
};

function messages(program) {
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    if (!diagnostic.file || diagnostic.start === undefined) return message;
    const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} ${message}`;
  });
}

test("the walkthrough examples cover every storefront flow and compile against the built SDK", () => {
  assert.deepEqual(
    examplePaths.map((path) => path.split("/").at(-1)),
    ["booking.ts", "cart.ts", "checkout.ts", "errors.ts", "forms.ts", "order-page.ts", "plain-client.ts", "products.ts", "setup.ts", "sign-in.ts"],
  );
  assert.deepEqual(messages(ts.createProgram({ rootNames: examplePaths, options: compilerOptions })), []);
});

const readmeNames = `
import type { AdminClient, ArkyStore, PostalAddress } from "arky-sdk";

declare global {
  const arky: ArkyStore;
  const admin: AdminClient;
  const process: { env: Record<string, string | undefined> };
  const catalog_id: string;
  const collection_id: string;
  const variant_id: string;
  const orderId: string;
  const address: PostalAddress;
  function solveBotCheck(provider: "turnstile" | "h_captcha", siteKey: string): Promise<string>;
}

export {};
`;

test("every TypeScript block in the README compiles against the built SDK", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const blocks = [...readme.matchAll(/```typescript\n([\s\S]*?)```/g)].map((match) => match[1]);
  assert.ok(blocks.length >= 15, `the README has ${blocks.length} TypeScript blocks`);
  const directory = fileURLToPath(new URL("./", import.meta.url));
  const files = new Map(blocks.map((block, index) => [`${directory}readme-block-${index + 1}.ts`, `${block}\nexport {};\n`]));
  files.set(`${directory}readme-names.d.ts`, readmeNames);
  const host = ts.createCompilerHost(compilerOptions);
  const fileExists = host.fileExists.bind(host);
  const readFile = host.readFile.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  host.fileExists = (name) => files.has(name) || fileExists(name);
  host.readFile = (name) => files.get(name) ?? readFile(name);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) =>
    files.has(name)
      ? ts.createSourceFile(name, files.get(name), languageVersion, true)
      : getSourceFile(name, languageVersion, onError, shouldCreate);
  const program = ts.createProgram({ rootNames: [...files.keys()], options: compilerOptions, host });
  assert.deepEqual(messages(program), []);
});
