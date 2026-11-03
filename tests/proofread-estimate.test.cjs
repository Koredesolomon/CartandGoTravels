/* eslint-disable @typescript-eslint/no-require-imports -- Compile the project module with the existing Node test runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const file = path.resolve(__dirname, '../src/lib/proofreadEstimate.ts');
const mod = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(mod, mod.exports);
const { estimateProofreadSeconds, describeTimeLeft, guessCharacters } = mod.exports;

test('estimate grows with text size and scanned files, and is capped', () => {
  assert.ok(estimateProofreadSeconds({ characters: 10_000, scans: 0 }) > estimateProofreadSeconds({ characters: 1_000, scans: 0 }));
  assert.equal(estimateProofreadSeconds({ characters: 1_000, scans: 2 }) - estimateProofreadSeconds({ characters: 1_000, scans: 0 }), 120);
  assert.equal(estimateProofreadSeconds({ characters: 10_000_000, scans: 0 }), 360);
});

test('time-left wording rounds up and never goes negative', () => {
  assert.equal(describeTimeLeft(300, 0), 'About 5 mins left');
  assert.equal(describeTimeLeft(300, 100), 'About 4 mins left');
  assert.equal(describeTimeLeft(300, 235), 'About 2 mins left');
  assert.equal(describeTimeLeft(300, 245), 'Less than a minute left');
  assert.match(describeTimeLeft(300, 400), /longer than usual/);
});

test('size proxy is bounded by the document character limit', () => {
  assert.equal(guessCharacters(100 * 1024 * 1024), 60_000);
});
