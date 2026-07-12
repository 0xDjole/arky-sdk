import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const fixtureUrl = new URL('./fixtures/client-contracts.ts', import.meta.url);

test('public client contracts satisfy the compile-time fixture', () => {
	const program = ts.createProgram({
		rootNames: [fixtureUrl.pathname],
		options: {
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
