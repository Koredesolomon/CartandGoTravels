/* eslint-disable @typescript-eslint/no-require-imports -- Node test loader compiles project TypeScript without another runtime dependency. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const overrides = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const requireOriginal = mod.require.bind(mod);
  mod.require = name => overrides.has(name) ? overrides.get(name) : name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : requireOriginal(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const payment = load('src/lib/payment.ts');
const { NextRequest } = require('next/server');
const callback = load('src/app/ai-consular-check/payment-callback/route.ts');
const ai = load('src/app/api/ai-consular-check/route.ts');
const verify = load('src/app/api/flutterwave/verify/route.ts');
const checkout = load('src/app/api/flutterwave/checkout/route.ts');
const originalFetch = global.fetch;
Object.assign(process.env, { PAYMENT_SESSION_SECRET: 'test-secret-that-is-more-than-32-characters', FLUTTERWAVE_SECRET_KEY: 'test', FLUTTERWAVE_AMOUNT: '49.99', FLUTTERWAVE_CURRENCY: 'USD', UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'test', APP_URL: 'https://site.test' });

function callbackRequest(id, token) {
  return new NextRequest(`https://site.test/ai-consular-check/payment-callback?transaction_id=${id}&status=successful`, { headers: token ? { cookie: `${payment.CHECKOUT_COOKIE}=${token}` } : {} });
}

test('signed access rejects raw IDs, tampering, wrong purpose, and expired tokens', () => {
  const token = payment.signToken('access', 'test-ref');
  assert.equal(payment.readToken(token, 'access').ref, 'test-ref');
  assert.equal(payment.readToken('12345', 'access'), null);
  assert.equal(payment.readToken(token + 'x', 'access'), null);
  assert.equal(payment.readToken(token, 'checkout'), null);
  assert.equal(payment.readToken(payment.signToken('access', 'test-ref', -1), 'access'), null);
});

test('AI and verification APIs deny unpaid and legacy-cookie requests before upstream calls', async () => {
  global.fetch = async () => { throw new Error('Upstream must not be called'); };
  try {
    for (const cookie of ['', 'ai_consular_unlocked=123', `${payment.ACCESS_COOKIE}=forged`]) {
      const request = new NextRequest('https://site.test/api/ai-consular-check', { method: 'POST', headers: { cookie }, body: '{}' });
      assert.equal((await ai.POST(request)).status, 402);
      assert.equal((await verify.POST(request)).status, 402);
    }
  } finally { global.fetch = originalFetch; }
});

test('callback binds a verified payment to checkout and prevents concurrent redemption and replay', async () => {
  const consumed = new Set();
  let ref = 'checkout-ref';
  global.fetch = async (url, init) => {
    if (url === 'https://redis.test') {
      const command = JSON.parse(init.body);
      assert.equal(command[0], 'SET');
      assert.equal(command.at(-1), 'NX');
      const exists = consumed.has(command[1]);
      consumed.add(command[1]);
      return Response.json({ result: exists ? null : 'OK' });
    }
    const id = String(url).split('/').at(-2);
    return Response.json({ status: 'success', data: { id: Number(id), tx_ref: ref, status: 'successful', currency: 'USD', amount: 49.99 } });
  };
  try {
    assert.match((await callback.GET(callbackRequest('123'))).headers.get('location'), /payment=failed/);
    const token = payment.signToken('checkout', ref);
    ref = 'someone-elses-payment';
    assert.match((await callback.GET(callbackRequest('123', token))).headers.get('location'), /payment=failed/);
    ref = 'checkout-ref';
    const results = await Promise.all([callback.GET(callbackRequest('123', token)), callback.GET(callbackRequest('123', token))]);
    assert.equal(results.filter(r => r.headers.get('location').endsWith('payment=success')).length, 1);
    const success = results.find(r => r.headers.get('location').endsWith('payment=success'));
    assert.ok(payment.readToken(success.cookies.get(payment.ACCESS_COOKIE).value, 'access'));
    assert.match((await callback.GET(callbackRequest('123', token))).headers.get('location'), /payment=failed/);
  } finally { global.fetch = originalFetch; }
});

test('payment verification rejects underpayment, wrong currency, failed and mismatched transactions', async () => {
  try {
    for (const patch of [{ amount: 1 }, { amount: 'NaN' }, { currency: 'NGN' }, { status: 'failed' }, { id: 456 }]) {
      global.fetch = async () => Response.json({ status: 'success', data: { id: 123, tx_ref: 'ref', status: 'successful', currency: 'USD', amount: 49.99, ...patch } });
      await assert.rejects(payment.verifyPayment('123'));
    }
    await assert.rejects(payment.verifyPayment('../123'));
    global.fetch = async () => Response.json({ error: 'unavailable' }, { status: 503 });
    await assert.rejects(payment.claimPayment('123', 'ref'));
  } finally { global.fetch = originalFetch; }
});

test('checkout creates a bound reference and denies cross-origin attempts', async () => {
  global.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    assert.match(body.tx_ref, /^cartandgo-/);
    assert.equal(body.customer.email, 'customer@example.com');
    assert.equal(body.redirect_url, 'https://site.test/ai-consular-check/payment-callback');
    return Response.json({ status: 'success', data: { link: 'https://checkout.flutterwave.com/v3/hosted/pay/test' } });
  };
  try {
    const request = origin => new NextRequest('https://site.test/api/flutterwave/checkout', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'customer@example.com' }) });
    assert.equal((await checkout.POST(request('https://other.test'))).status, 403);
    const response = await checkout.POST(request('https://site.test'));
    assert.equal(response.status, 200);
    assert.ok(payment.readToken(response.cookies.get(payment.CHECKOUT_COOKIE).value, 'checkout'));
  } finally { global.fetch = originalFetch; }
});

test('document uploads read TXT and DOCX contents and reject empty, oversized, invalid and excessive text', async () => {
  const { extractDocumentText } = load('src/lib/documentText.ts');
  assert.equal(await extractDocumentText(new File(['Actual application text'], 'sample.txt')), 'Actual application text');
  await assert.rejects(extractDocumentText(new File([], 'empty.txt')), /empty/);
  await assert.rejects(extractDocumentText(new File(['x'.repeat(12001)], 'long.txt')), /too long/);
  await assert.rejects(extractDocumentText(new File(['x'.repeat(10 * 1024 * 1024 + 1)], 'large.txt')), /10MB/);
  await assert.rejects(extractDocumentText(new File(['bad'], 'bad.docx')), /Unable to read/);
  await assert.rejects(extractDocumentText(new File(['bad'], 'bad.exe')), /Choose/);
  const JSZip = require('jszip');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Actual DOCX application text</w:t></w:r></w:p></w:body></w:document>');
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  assert.equal(await extractDocumentText(new File([bytes], 'sample.docx')), 'Actual DOCX application text');
});

function pdfFixture(text) {
  const stream = text ? `BT /F1 12 Tf 72 720 Td (${text}) Tj ET` : '';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let result = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => { offsets.push(result.length); result += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = result.length;
  result += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return result;
}

test('PDF uploads extract actual text and reject documents without readable text', async () => {
  const canvas = require('@napi-rs/canvas');
  global.DOMMatrix = canvas.DOMMatrix;
  global.Path2D = canvas.Path2D;
  global.ImageData = canvas.ImageData;
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const worker = new pdfjs.PDFWorker();
  // Use a filesystem worker in Node; production serves the same worker through /pdf.worker.min.mjs.
  overrides.set('pdfjs-dist/legacy/build/pdf.mjs', { ...pdfjs, getDocument: options => pdfjs.getDocument({ ...options, worker, standardFontDataUrl: path.join(root, "node_modules/pdfjs-dist/standard_fonts/"), cMapUrl: path.join(root, "node_modules/pdfjs-dist/cmaps/"), wasmUrl: path.join(root, "node_modules/pdfjs-dist/wasm/") }) });
  try {
    const { extractDocumentText } = load('src/lib/documentText.ts');
    assert.equal(await extractDocumentText(new File([pdfFixture('Actual PDF application text')], 'sample.pdf')), 'Actual PDF application text');
    await assert.rejects(extractDocumentText(new File([pdfFixture('')], 'scan.pdf')), /No readable text/);
    await assert.rejects(extractDocumentText(new File(['invalid'], 'bad.pdf')), /Unable to read/);
  } finally { worker.destroy(); overrides.delete('pdfjs-dist/legacy/build/pdf.mjs'); }
});
