/* eslint-disable @typescript-eslint/no-require-imports -- Node test loader compiles the project's TypeScript. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const requireOriginal = mod.require.bind(mod);
  mod.require = name => name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : requireOriginal(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return mod.exports;
}
const { createLeadSubmissionPdf } = load('src/lib/leadSubmissionPdf.ts');
const { POST } = load('src/app/api/lead-submissions/route.ts');

async function readPdf(bytes) {
  const canvas = require('@napi-rs/canvas');
  global.DOMMatrix = canvas.DOMMatrix;
  global.Path2D = canvas.Path2D;
  global.ImageData = canvas.ImageData;
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), disableFontFace: true });
  const document = await task.promise;
  try {
    const pages = [];
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      pages.push(content.items.filter(item => 'str' in item));
    }
    return pages;
  } finally { await task.destroy(); }
}

test('submission PDF preserves details, Unicode, multiline notes and long responses across pages', async () => {
  const longWord = 'longbookingreference'.repeat(20);
  const lines = Array.from({ length: 80 }, (_, index) => `Detail ${index}: Request value ${index}`);
  const message = ['Hello Cart&Go, I need help with travel.', 'Name: José Adé', 'Budget: ₦500,000 / €300', 'Notes: First line', 'Second line', longWord, ...lines].join('\n');
  const bytes = await createLeadSubmissionPdf({ message, email: 'visitor@example.com', submittedAt: new Date('2026-10-05T10:20:30Z') });
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  const pages = await readPdf(bytes);
  assert.ok(pages.length >= 2);
  const text = pages.flat().map(item => item.str).join('\n');
  for (const expected of ['Name: José Adé', 'Budget: ₦500,000 / €300', 'First line', 'Second line', 'visitor@example.com', '2026-10-05T10:20:30.000Z', ...lines]) {
    assert.ok(text.includes(expected), `Missing PDF text: ${expected}`);
  }
  assert.ok(text.replace(/\s/g, '').includes(longWord));
  pages.forEach((items, index) => {
    assert.ok(items.some(item => item.str === `Page ${index + 1} of ${pages.length}`));
    for (const item of items) {
      assert.ok(item.transform[4] >= 47 && item.transform[4] + item.width <= 549, 'PDF text stays inside horizontal margins');
      assert.ok(item.transform[5] >= 30, 'PDF text stays above page edge');
    }
  });
});

test('shared form email attaches the full submission as PDF and retains recipient and reply address', async () => {
  const saved = { RESEND_API_KEY: process.env.RESEND_API_KEY, LEAD_FROM_EMAIL: process.env.LEAD_FROM_EMAIL, LEAD_TO_EMAIL: process.env.LEAD_TO_EMAIL };
  const originalFetch = global.fetch;
  const originalError = console.error;
  let calls = 0;
  const message = 'Hello Cart&Go, I need help with a flight.\nName: Test Visitor\nDestination: Abuja\nNotes: Return flight please.';
  const request = body => new NextRequest('https://site.test/api/lead-submissions', { method: 'POST', body: JSON.stringify(body) });
  try {
    Object.assign(process.env, { RESEND_API_KEY: 'test-key', LEAD_FROM_EMAIL: 'forms@site.test', LEAD_TO_EMAIL: 'office@site.test' });
    global.fetch = async (url, init) => {
      calls++;
      assert.equal(url, 'https://api.resend.com/emails');
      const body = JSON.parse(init.body);
      assert.equal(body.to, 'office@site.test');
      assert.equal(body.from, 'forms@site.test');
      assert.equal(body.reply_to, 'visitor@example.com');
      assert.ok(!body.text.includes('Test Visitor'));
      assert.equal(body.attachments.length, 1);
      assert.match(body.attachments[0].filename, /^cartandgo-form-request-.*\.pdf$/);
      const pages = await readPdf(Buffer.from(body.attachments[0].content, 'base64'));
      const text = pages.flat().map(item => item.str).join('\n');
      assert.ok(text.includes(message));
      return Response.json({ id: 'test-email' });
    };
    const response = await POST(request({ email: 'visitor@example.com', message }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(calls, 1);

    for (const body of [{ message: '' }, { message: 'x'.repeat(6001) }, { message: 'Test', email: 'invalid' }, null]) {
      assert.equal((await POST(request(body))).status, 400);
    }
    assert.equal(calls, 1);

    console.error = () => {};
    global.fetch = async () => Response.json({ error: 'Delivery unavailable' }, { status: 503 });
    assert.equal((await POST(request({ message: 'Test' }))).status, 502);
    delete process.env.RESEND_API_KEY;
    global.fetch = async () => { throw new Error('Unconfigured delivery must not be called'); };
    assert.equal((await POST(request({ message: 'Test' }))).status, 502);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    global.fetch = originalFetch;
    console.error = originalError;
  }
});
