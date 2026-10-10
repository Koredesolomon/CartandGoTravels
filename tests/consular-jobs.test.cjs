/* eslint-disable @typescript-eslint/no-require-imports -- Use the project's Node test runtime and TypeScript loader. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const scheduled = [];
const nextServer = require('next/server');
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = name => name === 'next/server' ? { ...nextServer, after: work => scheduled.push(work) } : name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : original(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
Object.assign(process.env, { CONSULAR_PAYMENT_REQUIRED: 'true', PAYMENT_SESSION_SECRET: 'synthetic-test-secret-more-than-32-characters', ANTHROPIC_API_KEY: 'synthetic-test-key', NODE_ENV: 'test' });
const { signToken, ACCESS_COOKIE } = load('src/lib/payment.ts');
const { POST: startScan } = load('src/app/api/document-ocr/route.ts');
const { POST: startReview } = load('src/app/api/ai-consular-check/route.ts');
const { GET: poll, DELETE: cancel } = load('src/app/api/consular-jobs/[id]/route.ts');
const { enqueueConsularJob } = load('src/lib/consularJobs.ts');
const { readAssessmentFiles, AssessmentAccessError } = load('src/lib/assessmentFiles.ts');
const { requestConsularResult } = load('src/lib/consularRequest.ts');
const { CONSULAR_SESSION_COOKIE } = load('src/lib/consularAccess.ts');
const { POST: verifyAccess } = load('src/app/api/flutterwave/verify/route.ts');
const { POST: checkout } = load('src/app/api/flutterwave/checkout/route.ts');
const reader = load('src/lib/documentText.ts');
const { NextRequest } = nextServer;
const { PDFDocument } = require('pdf-lib');
const context = id => ({ params: Promise.resolve({ id }) });
const jobRequest = (id, owner, method = 'GET', expired = false) => new NextRequest(`https://site.test/api/consular-jobs/${id}`, { method, headers: owner ? { cookie: `${ACCESS_COOKIE}=${signToken('access', owner, expired ? -1 : 3600)}` } : {} });
const tokenHeaders = owner => ({ cookie: `${ACCESS_COOKIE}=${signToken('access', owner)}`, Prefer: 'respond-async' });
const scan = { text: '[Page 1]\nSynthetic scan text', notes: ['Page 1: Signature unverified'], pageCount: 1 };
const jobId = '11111111-1111-4111-8111-111111111111';

test('OCR returns 202 before the provider finishes, then exposes the complete private result only to its paid owner', async () => {
  const pdf = await PDFDocument.create(); pdf.addPage();
  const bytes = Buffer.from(await pdf.save());
  const owner = 'async-scan-owner';
  const original = global.fetch;
  let complete, calls = 0, id;
  global.fetch = async () => { calls++; return new Promise(resolve => { complete = resolve; }); };
  try {
    const response = await startScan(new NextRequest('https://site.test/api/document-ocr', { method: 'POST', headers: { ...tokenHeaders(owner), 'Content-Type': 'application/pdf' }, body: bytes }));
    assert.equal(response.status, 202);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    id = (await response.json()).jobId;
    assert.equal(calls, 0, 'The upload response does not wait for an AI call');
    const work = scheduled.shift()();
    assert.equal(calls, 1);
    assert.equal((await poll(jobRequest(id, owner), context(id))).status, 202);
    assert.equal((await poll(jobRequest(id), context(id))).status, 402);
    assert.equal((await poll(jobRequest(id, owner, 'GET', true), context(id))).status, 402);
    assert.equal((await poll(jobRequest(id, 'another-session'), context(id))).status, 404);
    await cancel(jobRequest(id, 'another-session', 'DELETE'), context(id));
    assert.equal((await poll(jobRequest(id, owner), context(id))).status, 202);
    complete(Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ pages: [{ page: 1, status: 'readable', text: 'Original scanned wording', notes: [] }] }) }] }));
    await work;
    const result = await poll(jobRequest(id, owner), context(id));
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
    assert.equal((await result.json()).text, '[Page 1]\nOriginal scanned wording');
  } finally {
    if (id) await cancel(jobRequest(id, owner, 'DELETE'), context(id));
    global.fetch = original;
  }
});

test('AI review also returns promptly and preserves controlled provider failures through polling', async () => {
  const owner = 'async-review-owner';
  const original = global.fetch;
  let calls = 0, id;
  global.fetch = async () => { calls++; return Response.json({ private: 'provider details' }, { status: 401 }); };
  try {
    const response = await startReview(new NextRequest('https://site.test/api/ai-consular-check', { method: 'POST', headers: { ...tokenHeaders(owner), 'Content-Type': 'application/json' }, body: JSON.stringify({ country: 'Ghana', visaClass: 'Visit / Tourist Visa', documents: [{ id: 'document-1', name: 'Purpose.txt', text: 'Synthetic purpose statement.' }] }) }));
    assert.equal(response.status, 202);
    id = (await response.json()).jobId;
    assert.equal(calls, 0);
    await scheduled.shift()();
    const result = await poll(jobRequest(id, owner), context(id));
    assert.equal(result.status, 503);
    const body = await result.json();
    assert.equal(body.code, 'provider_unavailable');
    assert.ok(body.requestId);
    assert.ok(!JSON.stringify(body).includes('provider details'));
  } finally {
    if (id) await cancel(jobRequest(id, owner, 'DELETE'), context(id));
    global.fetch = original;
  }
});

test('cancellation aborts pending work, prevents late results from reappearing, and does not grant access', async () => {
  const owner = 'cancel-owner';
  let resolve, signal;
  const response = enqueueConsularJob(owner, 1000, current => { signal = current; return new Promise(done => { resolve = done; }); });
  const id = (await response.json()).jobId;
  const work = scheduled.shift()();
  assert.equal((await cancel(jobRequest(id, undefined, 'DELETE'), context(id))).status, 402);
  assert.equal(signal.aborted, false);
  await cancel(jobRequest(id, owner, 'DELETE'), context(id));
  assert.equal(signal.aborted, true);
  resolve(Response.json(scan));
  await work;
  assert.equal((await poll(jobRequest(id, owner), context(id))).status, 404);
});

test('uncollected results expire and job deadlines abort work with a controlled timeout', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const owner = 'expiry-owner';
  const response = enqueueConsularJob(owner, 1000, async () => Response.json(scan));
  const id = (await response.json()).jobId;
  await scheduled.shift()();
  assert.equal((await poll(jobRequest(id, owner), context(id))).status, 200);
  now += 60_001;
  assert.equal((await poll(jobRequest(id, owner), context(id))).status, 404);
  t.mock.restoreAll();

  let signal;
  const timed = enqueueConsularJob(owner, 15, current => { signal = current; return new Promise((_, reject) => current.addEventListener('abort', () => reject(current.reason), { once: true })); });
  const timedId = (await timed.json()).jobId;
  const work = scheduled.shift()();
  await new Promise(resolve => setTimeout(resolve, 30));
  await work;
  assert.equal(signal.aborted, true);
  const result = await poll(jobRequest(timedId, owner), context(timedId));
  assert.equal(result.status, 504);
  assert.equal((await result.json()).code, 'review_timeout');
  await cancel(jobRequest(timedId, owner, 'DELETE'), context(timedId));
});

test('job concurrency is bounded before scheduling provider work', async () => {
  const ids = [];
  try {
    for (let index = 0; index < 4; index++) {
      const owner = `capacity-${index}`;
      const response = enqueueConsularJob(owner, 1000, async () => Response.json(scan));
      assert.equal(response.status, 202);
      ids.push([(await response.json()).jobId, owner]);
    }
    assert.equal(enqueueConsularJob('overflow', 1000, async () => Response.json(scan)).status, 429);
  } finally {
    for (const [id, owner] of ids) await cancel(jobRequest(id, owner, 'DELETE'), context(id));
    await Promise.all(scheduled.splice(0).map(work => work()));
  }
});

test('scan and review clients upload once, poll without documents and clear completed jobs', async () => {
  const original = global.fetch;
  const originalReader = reader.extractDocumentText;
  reader.extractDocumentText = async () => { throw new reader.ScannedPdfError(1); };
  try {
    for (const service of ['scan', 'review']) {
      const calls = [];
      global.fetch = async (url, init = {}) => {
        calls.push({ url, init });
        if (init.method === 'DELETE') return Response.json({ ok: true });
        if (url === `/api/${service === 'scan' ? 'document-ocr' : 'ai-consular-check'}`) return Response.json({ jobId, state: 'pending', text: 'Never accept this partial text' }, { status: 202 });
        assert.equal(url, `/api/consular-jobs/${jobId}`);
        return Response.json(service === 'scan' ? scan : { report: { summary: 'Complete report' } });
      };
      const signal = new AbortController().signal;
      const result = service === 'scan' ? await readAssessmentFiles([new File(['synthetic'], 'Scan.pdf')], signal) : await requestConsularResult('review', { method: 'POST', body: '{}' }, signal);
      assert.equal(calls.length, 3);
      assert.equal(calls[0].init.headers.get('Prefer'), 'respond-async');
      assert.equal(calls[1].init.body, undefined);
      assert.equal(calls[1].init.cache, 'no-store');
      assert.equal(calls[2].init.method, 'DELETE');
      if (service === 'scan') assert.equal(result[0].text, scan.text);
      else assert.equal(result.data.report.summary, 'Complete report');
    }
  } finally { global.fetch = original; reader.extractDocumentText = originalReader; }
});

test('polling handles expired access, cancellation and invalid job IDs while preserving uploads', async () => {
  const original = global.fetch, originalReader = reader.extractDocumentText;
  const file = new File(['synthetic'], 'Scan.pdf');
  reader.extractDocumentText = async () => { throw new reader.ScannedPdfError(1); };
  try {
    let deletes = 0;
    global.fetch = async (url, init = {}) => {
      if (init.method === 'DELETE') { deletes++; return Response.json({ ok: true }); }
      return url === '/api/document-ocr' ? Response.json({ jobId }, { status: 202 }) : new Response('<html>Expired access</html>', { status: 402 });
    };
    await assert.rejects(readAssessmentFiles([file], new AbortController().signal), AssessmentAccessError);
    assert.equal(deletes, 1);
    const controller = new AbortController();
    global.fetch = async (url, init = {}) => {
      if (init.method === 'DELETE') { deletes++; return Response.json({ ok: true }); }
      if (url === '/api/document-ocr') return Response.json({ jobId }, { status: 202 });
      controller.abort();
      return Response.json({ jobId }, { status: 202 });
    };
    await assert.rejects(readAssessmentFiles([file], controller.signal), /abort/i);
    assert.equal(deletes, 2);
    global.fetch = async () => Response.json({ jobId: 'https://untrusted.test' }, { status: 202 });
    await assert.rejects(readAssessmentFiles([file], new AbortController().signal), /invalid job reference/);
    assert.equal(file.size, 9);
  } finally { global.fetch = original; reader.extractDocumentText = originalReader; }
});

test('local free access creates separate private sessions and runs OCR without payment credentials', async () => {
  const saved = { CONSULAR_PAYMENT_REQUIRED: process.env.CONSULAR_PAYMENT_REQUIRED, PAYMENT_SESSION_SECRET: process.env.PAYMENT_SESSION_SECRET, NODE_ENV: process.env.NODE_ENV };
  const original = global.fetch;
  const ids = [];
  delete process.env.CONSULAR_PAYMENT_REQUIRED;
  delete process.env.PAYMENT_SESSION_SECRET;
  process.env.NODE_ENV = 'development';
  const freeRequest = (id, session, method = 'GET') => new NextRequest(`https://site.test/api/consular-jobs/${id}`, { method, headers: session ? { cookie: `${CONSULAR_SESSION_COOKIE}=${session}` } : {} });
  const upload = (bytes, session) => new NextRequest('https://site.test/api/document-ocr', { method: 'POST', headers: { Prefer: 'respond-async', 'Content-Type': 'application/pdf', ...(session ? { cookie: `${CONSULAR_SESSION_COOKIE}=${session}` } : {}) }, body: bytes });
  global.fetch = async url => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ pages: [{ page: 1, status: 'readable', text: 'Free scan result', notes: [] }] }) }] });
  };
  try {
    const pdf = await PDFDocument.create(); pdf.addPage();
    const bytes = await pdf.save();
    const response = await startScan(upload(bytes));
    assert.equal(response.status, 202);
    const session = response.cookies.get(CONSULAR_SESSION_COOKIE);
    assert.match(session.value, /^[a-f0-9]{64}$/);
    assert.equal(session.httpOnly, true);
    assert.equal(session.secure, true);
    assert.equal(session.sameSite, 'lax');
    assert.equal(response.cookies.get(ACCESS_COOKIE), undefined);
    const id = (await response.json()).jobId;
    ids.push([id, session.value]);
    const other = await verifyAccess(new NextRequest('https://site.test/api/flutterwave/verify', { method: 'POST' }));
    assert.equal(other.status, 200);
    assert.deepEqual(await other.json(), { verified: true, paymentRequired: false });
    const otherSession = other.cookies.get(CONSULAR_SESSION_COOKIE).value;
    assert.notEqual(otherSession, session.value);
    assert.equal((await poll(freeRequest(id), context(id))).status, 404);
    assert.equal((await poll(freeRequest(id, otherSession), context(id))).status, 404);
    await cancel(freeRequest(id, otherSession, 'DELETE'), context(id));
    assert.equal((await poll(freeRequest(id, session.value), context(id))).status, 202);
    await scheduled.shift()();
    const result = await poll(freeRequest(id, session.value), context(id));
    assert.equal(result.status, 200);
    assert.equal((await result.json()).text, '[Page 1]\nFree scan result');

    const again = await startScan(upload(bytes, session.value));
    assert.equal(again.status, 202);
    assert.equal(again.cookies.get(CONSULAR_SESSION_COOKIE), undefined, 'Reuse the browser identity');
    const againId = (await again.json()).jobId;
    ids.push([againId, session.value]);
    await scheduled.shift()();
    assert.equal((await poll(freeRequest(againId, session.value), context(againId))).status, 200);

    process.env.CONSULAR_PAYMENT_REQUIRED = 'true';
    assert.equal((await startScan(upload(bytes, session.value))).status, 402, 'An anonymous session cannot unlock paid mode');
    assert.equal((await poll(freeRequest(id, session.value), context(id))).status, 402);
    process.env.CONSULAR_PAYMENT_REQUIRED = 'false';
  } finally {
    for (const [id, session] of ids) await cancel(freeRequest(id, session, 'DELETE'), context(id));
    global.fetch = original;
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('free mode disables checkout, preserves input validation and permits anonymous AI review', async () => {
  const saved = process.env.CONSULAR_PAYMENT_REQUIRED;
  const original = global.fetch;
  process.env.CONSULAR_PAYMENT_REQUIRED = 'false';
  let id, session;
  global.fetch = async url => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages', 'No Flutterwave request is allowed');
    return Response.json({ error: 'Synthetic provider failure' }, { status: 401 });
  };
  try {
    const payment = await checkout(new NextRequest('https://site.test/api/flutterwave/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'synthetic@example.com' }) }));
    assert.equal(payment.status, 409);
    assert.equal((await payment.json()).code, 'PAYMENT_DISABLED');
    assert.equal((await startScan(new NextRequest('https://site.test/api/document-ocr', { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: 'Invalid PDF' }))).status, 400);
    assert.equal((await startReview(new NextRequest('https://site.test/api/ai-consular-check', { method: 'POST', body: '{}' }))).status, 400);
    const response = await startReview(new NextRequest('https://site.test/api/ai-consular-check', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'respond-async' }, body: JSON.stringify({ country: 'Ghana', visaClass: 'Visit / Tourist Visa', documents: [{ id: 'document-1', name: 'Purpose.txt', text: 'Synthetic purpose statement.' }] }) }));
    assert.equal(response.status, 202);
    id = (await response.json()).jobId;
    session = response.cookies.get(CONSULAR_SESSION_COOKIE).value;
    await scheduled.shift()();
    const request = new NextRequest(`https://site.test/api/consular-jobs/${id}`, { headers: { cookie: `${CONSULAR_SESSION_COOKIE}=${session}` } });
    const result = await poll(request, context(id));
    assert.equal(result.status, 503);
    assert.equal((await result.json()).code, 'provider_unavailable');
  } finally {
    if (id) await cancel(new NextRequest(`https://site.test/api/consular-jobs/${id}`, { method: 'DELETE', headers: { cookie: `${CONSULAR_SESSION_COOKIE}=${session}` } }), context(id));
    global.fetch = original;
    process.env.CONSULAR_PAYMENT_REQUIRED = saved;
  }
});
