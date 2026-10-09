/* eslint-disable @typescript-eslint/no-require-imports -- Compile project TypeScript for Node tests. */
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
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = name => name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : original(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const { itineraryCities } = load('src/data/itineraryDestinations.ts');
const { buildItinerary } = load('src/lib/itinerary.ts');
const { validateItineraryExport } = load('src/lib/itineraryExport.ts');
const { itineraryDocumentRequirements, MAX_SUPPORT_TOTAL_BYTES } = load('src/lib/itineraryDocumentRequirements.ts');
const { validateSupportingDocuments } = load('src/lib/itinerarySupportingDocuments.ts');
const { PDFDocument } = require('pdf-lib');
const { createItineraryPdf } = load('src/lib/itineraryPdf.ts');
const { POST } = load('src/app/api/itinerary-pdf/route.ts');
const { signToken, ACCESS_COOKIE } = load('src/lib/payment.ts');
process.env.PAYMENT_SESSION_SECRET = 'test-secret-that-is-more-than-32-characters';

function fixture(days = '3') {
  const city = itineraryCities[0];
  const details = { destination: 'Qatar', start: '2026-11-09', arrival: '10:00', departure: '18:00', pace: 'balanced', interests: ['Culture & history'], notes: 'Vegetarian meals', stops: [{ id: 'stop-0', cityId: city.id, cityName: city.name, days, transferHours: '3', hotel: 'Example Hotel, Doha — address supplied by traveler' }] };
  const plan = buildItinerary(details, city.places, ['doha-1', 'doha-2']);
  return { plan, accommodations: [{ stopId: 'stop-0', name: 'Example Hotel, Doha — address supplied by traveler', reference: 'HOTEL123', status: 'Reserved' }], traveler: { fullName: 'José Adé', passportNumber: 'A12345678', visaCategory: 'Tourist / Leisure', primaryTie: 'Permanent Employment', tieEvidence: 'Employment letter and approved leave letter', financialEvidence: 'Three months of bank statements showing salary credits', inbound: { date: '2026-11-09', reference: 'QR 123 · PNR ABC123', status: 'Reserved' }, outbound: { date: plan.days.at(-1).date, reference: 'QR 456 · PNR DEF456', status: 'Confirmed' } } };
}
let proofBytes;
async function documents(input) {
  if (!proofBytes) { const pdf = await PDFDocument.create(); pdf.addPage(); proofBytes = await pdf.save(); }
  return itineraryDocumentRequirements(input.plan).map(entry => ({ ...entry, filename: `${entry.key}-proof.pdf`, mimeType: 'application/pdf', bytes: proofBytes }));
}
async function formFor(input) {
  const form = new FormData();
  form.set('itinerary', JSON.stringify(input));
  for (const doc of await documents(input)) form.set(doc.key, new File([doc.bytes], 'proof.pdf', { type: doc.mimeType }));
  return form;
}
async function req(value, paid = true, raw = false) {
  return new NextRequest('https://site.test/api/itinerary-pdf', { method: 'POST', headers: paid ? { cookie: `${ACCESS_COOKIE}=${signToken('access', 'paid-test-ref')}` } : {}, body: raw ? value : await formFor(value) });
}

async function readPdf(bytes) {
  const canvas = require('@napi-rs/canvas');
  global.DOMMatrix = canvas.DOMMatrix; global.Path2D = canvas.Path2D; global.ImageData = canvas.ImageData;
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), disableFontFace: true, standardFontDataUrl: path.join(root, 'node_modules/pdfjs-dist/standard_fonts/') });
  const pdf = await task.promise;
  try {
    const pages = [];
    for (let index = 1; index <= pdf.numPages; index++) {
      const page = await pdf.getPage(index);
      const { items } = await page.getTextContent();
      pages.push(items.filter(item => 'str' in item));
    }
    pages.attachments = await pdf.getAttachments();
    if (pages.attachments) for (const [id, attachment] of pages.attachments) attachment.content = await pdf.getAttachmentContent(id);
    pages.metadata = await pdf.getMetadata();
    return pages;
  } finally { await task.destroy(); }
}

test('formal itinerary PDF preserves traveler details, edited activities and Unicode across pages', async () => {
  const input = fixture('30');
  const longWord = 'LONGREFERENCE'.repeat(20);
  input.plan.days[0].notes = `Confirmation details: ${longWord}\nAdditional note line`;
  const visit = input.plan.days.flatMap(day => day.events).find(event => event.placeId === 'doha-1');
  visit.notes = 'Client reservation note: ABC789';
  const pdf = await createItineraryPdf(validateItineraryExport(input), await documents(input), new Date('2026-10-07T23:30:00Z'));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  const pages = await readPdf(pdf);
  assert.ok(pages.length >= 5);
  const text = pages.flat().map(item => item.str).join('\n').replace(/\s+/g, ' ');
  for (const expected of ['FLIGHT & ACCOMMODATION ITINERARY', 'José Adé', 'A12345678', 'Tourist / Leisure', 'Permanent Employment', 'Employment letter', 'bank statements', 'HOTEL123', 'Status: Reserved', 'Status: Confirmed', 'QR 123', 'QR 456', 'Example Hotel', 'Vegetarian meals', 'ABC789', 'Additional note line', 'Day 30', '8 Oct 2026', 'Supporting documents']) assert.ok(text.includes(expected), expected);
  assert.ok(text.replace(/\s/g, '').includes(longWord));
  assert.ok(!/Cart.?Go|CartandGo/i.test(text));
  assert.equal(pages.metadata.info.Author, 'José Adé');
  const attached = [...pages.attachments.values()];
  assert.equal(attached.length, 6);
  for (const item of attached) assert.deepEqual(new Uint8Array(item.content), new Uint8Array(proofBytes));
  for (const [index, items] of pages.entries()) {
    assert.ok(items.some(item => item.str === `Page ${index + 1} of ${pages.length}`));
    for (const item of items) {
      assert.ok(item.transform[4] >= 39 && item.transform[4] + item.width < 557, 'Text stays within page margins');
      assert.ok(item.transform[5] >= 30 && item.transform[5] < 810, 'Text stays within page height');
    }
  }
});

test('export validation rejects inconsistent dates, city changes, missing identity, duplicates and schedule conflicts', () => {
  const mutate = callback => { const input = fixture(); callback(input); return input; };
  const bad = [
    mutate(input => { input.traveler.fullName = ' '; }),
    mutate(input => { input.traveler.passportNumber = ''; }),
    mutate(input => { input.plan.days[0].date = '2026-12-01'; }),
    mutate(input => { input.plan.days[0].cityId = 'paris'; }),
    mutate(input => { input.plan.details.stops[0].cityName = 'Paris'; }),
    mutate(input => { input.plan.days.pop(); }),
    mutate(input => { input.plan.days[0].events.push({ ...input.plan.days[0].events[0] }); }),
    mutate(input => { input.plan.days[0].events.push({ id: 'conflict', type: 'personal', title: 'Meeting', start: '10:30', end: '11:00', notes: '' }); }),
  ];
  for (const input of bad) assert.throws(() => validateItineraryExport(input));
  assert.throws(() => validateItineraryExport(null));
  const input = fixture();
  input.plan.places[0].source = 'https://untrusted.test'; input.plan.places[0].name = 'Fake place';
  const validated = validateItineraryExport(input);
  assert.equal(validated.plan.places[0].name, 'Souq Waqif');
  assert.ok(!validated.plan.places[0].source.includes('untrusted'));
});

test('PDF route requires paid access, validates payload size and returns a private PDF attachment', async () => {
  assert.equal((await POST(await req(fixture(), false))).status, 402);
  for (const input of [null, {}, { traveler: {}, plan: {} }]) { const form = new FormData(); form.set('itinerary', JSON.stringify(input)); const request = new NextRequest('https://site.test/api/itinerary-pdf', { method: 'POST', headers: { cookie: `${ACCESS_COOKIE}=${signToken('access', 'paid-test-ref')}` }, body: form }); assert.equal((await POST(request)).status, 400); }
  assert.equal((await POST(await req('{bad', true, true))).status, 400);
  const large = await req(fixture()); large.headers.set('content-length', String(MAX_SUPPORT_TOTAL_BYTES + 512 * 1024 + 1)); assert.equal((await POST(large)).status, 413);
  const response = await POST(await req(fixture()));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.match(response.headers.get('content-disposition'), /attachment; filename="Flight-Accommodation-Itinerary-Qatar-2026-11-09.pdf"/);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
});

test('PDF requires paid access on every host even with the retired preview flag', async () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, CONSULAR_LOCAL_PREVIEW: process.env.CONSULAR_LOCAL_PREVIEW };
  try {
    Object.assign(process.env, { NODE_ENV: 'development', CONSULAR_LOCAL_PREVIEW: 'true' });
    for (const mode of ['development', 'production', 'test']) {
      process.env.NODE_ENV = mode;
      for (const host of ['localhost:3000', '127.0.0.1:3000', '[::1]:3000', 'site.test']) {
        const unpaid = new NextRequest(`http://${host}/api/itinerary-pdf`, { method: 'POST', body: '{}' });
        assert.equal((await POST(unpaid)).status, 402);
      }
      assert.equal((await POST(await req(fixture()))).status, 200);
    }
  } finally {
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('PDF export requires payment even if the removed development bypass flag is still configured', async () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, CONSULAR_DEV_BYPASS_PAYMENT: process.env.CONSULAR_DEV_BYPASS_PAYMENT };
  try {
    process.env.CONSULAR_DEV_BYPASS_PAYMENT = 'true';
    for (const mode of ['development', 'production', 'test']) {
      process.env.NODE_ENV = mode;
      const response = await POST(await req(fixture(), false));
      assert.equal(response.status, 402);
    }
    process.env.NODE_ENV = 'development';
    delete process.env.CONSULAR_DEV_BYPASS_PAYMENT;
    assert.equal((await POST(await req(fixture(), false))).status, 402);
  } finally {
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});


test('required documents are validated from file contents and included once for every city stop', async () => {
  const input = fixture();
  for (const { key } of itineraryDocumentRequirements(input.plan)) {
    const form = await formFor(input); form.delete(key);
    await assert.rejects(validateSupportingDocuments(form, input.plan), /Upload/);
  }
  const duplicate = await formFor(input); duplicate.append('passport', new File([proofBytes], 'extra.pdf'));
  await assert.rejects(validateSupportingDocuments(duplicate, input.plan), /Upload/);
  for (const [name, bytes] of [['fake.pdf', 'not a PDF'], ['fake.png', 'not a PNG'], ['proof.txt', 'content'], ['empty.pdf', '']]) {
    const form = await formFor(input); form.set('passport', new File([bytes], name));
    await assert.rejects(validateSupportingDocuments(form, input.plan));
  }
  const oversized = await formFor(input); oversized.set('finance', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'bank.pdf'));
  await assert.rejects(validateSupportingDocuments(oversized, input.plan), /5 MB/);
  const jpg = await formFor(input); jpg.set('passport', new File([fs.readFileSync(path.join(root, 'public/assets/logo.jpg'))], 'passport.jpg'));
  assert.equal((await validateSupportingDocuments(jpg, input.plan))[0].mimeType, 'image/jpeg');
  const missing = await formFor(input); missing.delete('finance');
  const request = await req(input); const noFilesRequest = new NextRequest(request.url, {method: 'POST', headers: { cookie: request.headers.get('cookie') }, body: missing});
  assert.equal((await POST(noFilesRequest)).status, 400);
});

test('visa-support details and reservations are mandatory and flight dates match the schedule', () => {
  for (const field of ['fullName', 'passportNumber', 'visaCategory', 'primaryTie', 'tieEvidence', 'financialEvidence']) {
    const input = fixture(); input.traveler[field] = ''; assert.throws(() => validateItineraryExport(input));
  }
  for (const segment of ['inbound', 'outbound']) {
    for (const field of ['date', 'reference', 'status']) { const input = fixture(); input.traveler[segment][field] = ''; assert.throws(() => validateItineraryExport(input)); }
  }
  for (const field of ['name', 'reference', 'status']) { const input = fixture(); input.accommodations[0][field] = ''; assert.throws(() => validateItineraryExport(input)); }
  const dates = fixture(); dates.traveler.outbound.date = '2026-11-20'; assert.throws(() => validateItineraryExport(dates), /Flight dates/);
  const missingStay = fixture(); missingStay.accommodations = []; assert.throws(() => validateItineraryExport(missingStay), /every city stop/);
  const falseStatus = fixture(); falseStatus.accommodations[0].status = 'Verified'; assert.throws(() => validateItineraryExport(falseStatus), /reservation status/);
});
