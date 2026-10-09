/* eslint-disable @typescript-eslint/no-require-imports -- Compile project TypeScript with the existing Node test runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../src/lib/cvPreviewWorker.ts');
const mod = new Module(filename, module);
mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { startPreviewWorker } = mod.exports;
class PreviewWorker extends EventTarget {
  terminated = 0;
  terminate() { this.terminated++; }
  ready() { this.dispatchEvent(new MessageEvent('message', { data: { action: 'ready', data: new Uint8Array([1]) } })); }
}

test('a preview worker download failure is recoverable with a fresh attempt and keeps errors from escaping the page', async () => {
  const controller = new AbortController();
  const failedWorker = new PreviewWorker();
  const failure = assert.rejects(startPreviewWorker(failedWorker, controller.signal), /Could not load the CV preview/);
  const event = new Event('error', { cancelable: true });
  failedWorker.dispatchEvent(event);
  await failure;
  assert.equal(event.defaultPrevented, true);
  assert.equal(failedWorker.terminated, 1);
  const nextWorker = new PreviewWorker();
  const recovery = startPreviewWorker(nextWorker, controller.signal);
  nextWorker.ready(); await recovery;
  controller.abort();
  assert.equal(nextWorker.terminated, 0, 'Completed startup detaches the cancellation listener');
});

test('cancelled and already-cancelled preview attempts terminate startup and ignore late readiness', async () => {
  for (const alreadyCancelled of [false, true]) {
    const controller = new AbortController();
    const worker = new PreviewWorker();
    if (alreadyCancelled) controller.abort();
    const rejected = assert.rejects(startPreviewWorker(worker, controller.signal), { name: 'AbortError' });
    if (!alreadyCancelled) controller.abort();
    worker.ready(); await rejected;
    assert.equal(worker.terminated, 1);
    worker.ready(); assert.equal(worker.terminated, 1);
  }
});

test('unresponsive or invalid worker readiness ends with a retry message instead of waiting indefinitely', async () => {
  const worker = new PreviewWorker();
  const rejected = assert.rejects(startPreviewWorker(worker, new AbortController().signal, 15), /preview took too long.*retry/);
  worker.dispatchEvent(new MessageEvent('message', { data: { action: 'ready', data: 'invalid' } }));
  worker.dispatchEvent(new MessageEvent('message', { data: { action: 'unrelated', data: new Uint8Array([1]) } }));
  await rejected;
  assert.equal(worker.terminated, 1);
  worker.ready(); assert.equal(worker.terminated, 1);
});
