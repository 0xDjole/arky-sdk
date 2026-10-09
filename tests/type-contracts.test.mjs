import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fixtureDirectory = new URL('./fixtures/', import.meta.url);
const fixturePaths = readdirSync(fixtureDirectory)
  .filter(name => name.endsWith('.ts') || name.endsWith('.mjs'))
  .sort()
  .map(name => fileURLToPath(new URL(name, fixtureDirectory)));

test('public client contracts satisfy every compile-time fixture', () => {
	const program = ts.createProgram({
		rootNames: fixturePaths,
		options: {
			allowJs: true,
			checkJs: true,
			allowImportingTsExtensions: true,
			module: ts.ModuleKind.NodeNext,
			moduleResolution: ts.ModuleResolutionKind.NodeNext,
			noEmit: true,
			skipLibCheck: true,
			strict: true,
			target: ts.ScriptTarget.ES2022
		}
	});
	const diagnostics = ts.getPreEmitDiagnostics(program);
	assert.deepEqual(
		diagnostics.map((diagnostic) => {
			const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
			if (!diagnostic.file || diagnostic.start === undefined) return message;
			const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
			return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} ${message}`;
		}),
		[]
	);
});
