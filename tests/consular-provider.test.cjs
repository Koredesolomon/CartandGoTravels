/* eslint-disable @typescript-eslint/no-require-imports -- Use the existing Node test runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../src/lib/consularProvider.ts');
const compiled = new Module(filename, module);
compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { requestConsularProvider, consularProviderFailureReason } = compiled.exports;

test('a transient provider failure retries the same body once without resetting its deadline', async () => {
  const original = global.fetch;
  const signal = AbortSignal.timeout(3000);
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return calls.length === 1 ? Response.json({ error: 'Synthetic overload' }, { status: 529 }) : Response.json({ text: 'Complete synthetic output' });
  };
  try {
    const response = await requestConsularProvider({ method: 'POST', body: '{"synthetic":true}', signal });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.url === 'https://api.anthropic.com/v1/messages' && call.init.body === '{"synthetic":true}' && call.init.signal === signal));
    assert.equal((await response.json()).text, 'Complete synthetic output');
  } finally { global.fetch = original; }
});

test('permanent provider errors and usage limits are returned without repeated requests', async () => {
  const original = global.fetch;
  try {
    for (const status of [400, 401, 403, 429]) {
      let calls = 0;
      global.fetch = async () => { calls++; return Response.json({ error: 'Synthetic failure' }, { status }); };
      const response = await requestConsularProvider({ method: 'POST', body: '{}', signal: AbortSignal.timeout(3000) });
      assert.equal(response.status, status);
      assert.equal(calls, 1);
    }
  } finally { global.fetch = original; }
});

test('cancellation during retry backoff prevents another provider request', async () => {
  const original = global.fetch;
  const controller = new AbortController();
  let calls = 0;
  global.fetch = async () => {
    calls++;
    queueMicrotask(() => controller.abort());
    return Response.json({ error: 'Synthetic temporary failure' }, { status: 503 });
  };
  try {
    await assert.rejects(requestConsularProvider({ method: 'POST', body: '{}', signal: controller.signal }), { name: 'AbortError' });
    assert.equal(calls, 1);
  } finally { global.fetch = original; }
});

test('credit exhaustion has a fixed diagnostic category without exposing the provider message', async () => {
  assert.equal(await consularProviderFailureReason(Response.json({ error: { message: 'Your credit balance is too low to access the service. Synthetic private marker.' } }, { status: 400 })), 'insufficient_credit');
  for (const response of [Response.json({ error: { message: 'Invalid configuration.' } }, { status: 400 }), new Response('<html>Upstream failure</html>', { status: 400 }), Response.json(null, { status: 400 }), Response.json({ error: { message: 42 } }, { status: 400 }), new Response(null, { status: 503 })]) {
    assert.equal(await consularProviderFailureReason(response), 'unavailable');
  }
});
