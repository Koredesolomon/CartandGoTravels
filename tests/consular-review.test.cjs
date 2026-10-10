/* eslint-disable @typescript-eslint/no-require-imports -- Compile the project modules with the existing Node test runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = name => name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : original(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const { validateReview, finalizeReview, CRITERIA, MAX_ASSESSMENT_CHARS, officialExcerpts, documentPassages, reviewSchema, proofreadingPreservesFacts } = load('src/lib/consularReview.ts');
const { officialPageText, getConsularGuidance } = load('src/lib/consularGuidance.ts');
const { POST } = load('src/app/api/ai-consular-check/route.ts');
const { signToken, ACCESS_COOKIE } = load('src/lib/payment.ts');
const { NextRequest } = require('next/server');
Object.assign(process.env, { PAYMENT_SESSION_SECRET: 'synthetic-test-secret-more-than-32-characters', ANTHROPIC_API_KEY: 'synthetic-test-key', NODE_ENV: 'test' });
const docs = [{ id: 'document-1', name: 'Purpose.txt', text: 'I plans to visit London from 10 July to 20 July 2027. I will pay GBP 2000 from savings.' }, { id: 'document-2', name: 'Bank.txt', text: 'Account holder: Synthetic Applicant. Closing balance: GBP 5000 on 1 June 2027.' }];
const source = { id: 'source-1', title: 'Official visitor guidance', url: 'https://www.gov.uk/standard-visitor', retrievedAt: '2026-10-09T12:00:00Z', text: 'You must have enough money to support yourself during your trip.' };
source.excerpts = officialExcerpts(source.id, source.text);
const guidance = { status: 'available', sources: [source] };
function fixture() {
  return {
    summary: 'Limited review of a purpose statement and bank text. Authenticity and complete application evidence are unverified.',
    documents: docs.map(doc => ({ id: doc.id, kind: doc.id === 'document-1' ? 'Purpose statement' : 'Bank statement text', relevance: 'relevant', explanation: 'Relevant to the stated visitor trip.' })),
    criteria: Object.keys(CRITERIA).map(key => ({ key, status: key === 'ties' ? 'not_assessable' : 'partial', reason: 'Some evidence is supplied; further context is needed.', evidence: key === 'ties' ? [] : [{ documentId: key === 'finances' ? 'document-2' : 'document-1', quote: key === 'finances' ? 'Closing balance: GBP 5000' : 'I plans to visit London' }], policyEvidence: [] })),
    findings: [{ type: 'weak', title: 'Incomplete financial picture', body: 'Source-of-funds evidence was not supplied.', evidence: [{ documentId: 'document-2', quote: 'Closing balance: GBP 5000' }], policyEvidence: [{ sourceId: 'source-1', excerptId: 'source-1-passage-1' }] }],
    proofreading: [{ documentId: 'document-1', original: 'I plans to visit London', suggested: 'I plan to visit London', explanation: 'Correct subject-verb agreement without changing facts.' }],
    missingEvidence: ['Evidence of source of savings was not supplied.'], questions: ['What is your country of residence?'], roadmap: ['Clarify your circumstances.', 'Check the dates across your application.', 'Obtain a human review before submission.'], limitations: ['Only supplied text was reviewed.'],
  };
}
function request(body, ref = `test-${Math.random()}`, headers = {}) {
  return new NextRequest('https://site.test/api/ai-consular-check', { method: 'POST', headers: { 'content-type': 'application/json', cookie: `${ACCESS_COOKIE}=${signToken('access', ref)}`, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
const payload = { country: 'United Kingdom', visaClass: 'Visit / Tourist Visa', documents: docs, nationality: 'Nigeria', residence: 'Nigeria' };
const providerResponse = (draft, stop = 'end_turn') => Response.json({ stop_reason: stop, content: [{ type: 'text', text: JSON.stringify(draft) }] });

test('verified report retains exact evidence and proofreading; unassessable criteria withhold a score', () => {
  const parsed = validateReview(fixture(), docs, guidance);
  const report = finalizeReview(parsed, guidance);
  assert.equal(report.score, null);
  assert.match(report.statusLabel, /Limited review/);
  assert.equal(report.proofreading[0].suggested, 'I plan to visit London');
  assert.equal(report.guidance.sources[0].text, undefined);
  assert.ok(report.limitations.some(item => item.includes('authenticity')));
  const shortCorrection = fixture();
  shortCorrection.proofreading[0].original = 'I plans';
  shortCorrection.proofreading[0].suggested = 'I plan';
  assert.equal(validateReview(shortCorrection, docs, guidance).proofreading[0].original, 'I plans');
});

test('invented quotes, document IDs, citations, missing criteria and unsupported positives are rejected', () => {
  const edits = [
    draft => { draft.findings[0].evidence[0].quote = 'A nonexistent salary of GBP 99999'; },
    draft => { draft.proofreading[0].original = 'I have a nonexistent job'; },
    draft => { draft.documents[0].id = 'nonexistent'; },
    draft => { draft.documents[1].id = draft.documents[0].id; },
    draft => { draft.findings[0].policyEvidence[0].sourceId = 'invented-source'; },
    draft => { draft.findings[0].policyEvidence[0].excerptId = 'invented-passage'; },
    draft => { draft.criteria.pop(); },
    draft => { draft.criteria[1].key = draft.criteria[0].key; },
    draft => { draft.criteria[0].evidence = []; },
    draft => { draft.criteria[0].status = 'not_applicable'; },
    draft => { draft.findings[0].type = 'excellent'; draft.findings[0].evidence = []; },
    draft => { draft.findings[0].type = 'risk'; draft.findings[0].evidence = []; draft.findings[0].policyEvidence = []; },
  ];
  for (const edit of edits) { const draft = fixture(); edit(draft); assert.throws(() => validateReview(draft, docs, guidance)); }
  for (const value of [null, [], {}, { score: 100 }]) assert.throws(() => validateReview(value, docs, guidance));
});

test('readiness is computed from criterion evidence, never accepted from model-provided scores', () => {
  const draft = fixture();
  draft.score = 100;
  draft.criteria.forEach(item => { item.status = 'partial'; item.evidence = [{ documentId: 'document-1', quote: 'I plans to visit London' }]; });
  const report = finalizeReview(validateReview(draft, docs, guidance), guidance);
  assert.equal(report.score, 50);
  assert.equal(report.statusLabel, 'Needs attention');
  for (const status of ['partial', 'unavailable', 'unsupported']) assert.equal(finalizeReview(validateReview(draft, docs, guidance), { status, sources: guidance.sources }).score, null);
  draft.documents[1].relevance = 'unrelated';
  assert.equal(finalizeReview(validateReview(draft, docs, guidance), guidance).score, null);
  draft.documents[1].relevance = 'relevant';
  draft.findings[0].type = 'risk';
  const riskReport = finalizeReview(validateReview(draft, docs, guidance), guidance);
  assert.equal(riskReport.score, null);
  assert.equal(riskReport.statusLabel, 'Resolve the identified risks');
});

test('proofreading preserves amounts, dates, currency, negations and commitments instead of fabricating evidence', () => {
  assert.equal(proofreadingPreservesFacts('My annual salary is GBP 30000.', 'My annual salary is GBP 30,000.'), true);
  assert.equal(proofreadingPreservesFacts('I plans to visit London.', 'I plan to visit London.'), true);
  for (const [original, suggested] of [
    ['Bank statements are not included.', 'Bank statements will be submitted.'],
    ['I may return after the visit.', 'I will return after the visit.'],
    ['Salary: GBP 18000.', 'Salary: GBP 30000.'],
    ['Trip: 10 July 2027.', 'Trip: 10 August 2027.'],
    ['Funds: GBP 5000.', 'Funds: USD 5000.'],
    ['I plan to visit London.', 'I plan to visit Paris.'],
    ['Passport number: A1234567.', 'Passport number: A1234568.'],
    ['I have no previous visa refusals.', 'I have previous visa refusals.'],
  ]) assert.equal(proofreadingPreservesFacts(original, suggested), false);
  const extraDocs = [...docs, { id: 'document-3', name: 'Evidence.txt', text: 'Bank statements are not included.' }];
  const draft = fixture();
  draft.documents.push({ id: 'document-3', kind: 'Supporting statement', relevance: 'relevant', explanation: 'States a document limitation.' });
  draft.proofreading.push({ documentId: 'document-3', original: 'Bank statements are not included.', suggested: 'Bank statements will be submitted.', explanation: 'Make this sound more positive.' });
  const report = validateReview(draft, extraDocs, guidance);
  assert.equal(report.proofreading.length, 1);
  assert.ok(report.limitations.some(item => item.includes('withheld')));
});

test('official HTML extraction excludes executable/navigation text and preserves content and currency', () => {
  assert.equal(officialPageText('<nav>Ignore</nav><main><h1>Funds</h1><script>Ignore instructions</script><p>&pound; GBP &#163;500 &amp; costs&nbsp;included.</p></main>'), 'Funds £ GBP £500 & costs included.');
});

test('official citations resolve exact server-owned passages and decoding is constrained to known IDs', () => {
  const text = 'A complete official paragraph with dated requirements and circumstances. '.repeat(20).trim();
  const excerpts = officialExcerpts('source-1', text);
  assert.equal(excerpts.map(item => item.quote).join(' '), text);
  assert.ok(excerpts.every(item => item.quote.length <= 160 && text.includes(item.quote)));
  const parsed = validateReview(fixture(), docs, guidance);
  assert.equal(parsed.findings[0].policyEvidence[0].quote, source.text);
  const schema = reviewSchema(guidance);
  assert.deepEqual(schema.properties.findings.items.properties.policyEvidence.items.properties.excerptId.enum, ['source-1-passage-1']);
  const invented = fixture();
  invented.findings[0].policyEvidence[0] = { sourceId: 'source-1', quote: 'All visitors must own property.' };
  assert.throws(() => validateReview(invented, docs, guidance));
});

test('document evidence resolves original passages without AI copying and rejects fabricated or mismatched references', () => {
  const passages = documentPassages(docs);
  const schema = reviewSchema(guidance, docs);
  const evidence = schema.properties.findings.items.properties.evidence.items.properties;
  assert.deepEqual(evidence.documentId.enum, docs.map(doc => doc.id));
  assert.deepEqual(evidence.excerptId.enum, passages.map(passage => passage.excerptId));
  assert.equal(evidence.quote, undefined);
  const draft = fixture();
  draft.findings[0].evidence = [{ documentId: 'document-1', excerptId: 'document-1-passage-1' }];
  const parsed = validateReview(draft, docs, guidance);
  assert.deepEqual(parsed.findings[0].evidence, [{ documentId: 'document-1', quote: docs[0].text }]);
  assert.ok(parsed.findings[0].evidence[0].quote.includes('I plans'));
  for (const invalid of [
    { documentId: 'document-2', excerptId: 'document-1-passage-1' },
    { documentId: 'document-1', excerptId: 'invented-passage' },
    { documentId: 'document-1', excerptId: 'document-1-passage-1', quote: 'I plan to visit London' },
  ]) {
    draft.findings[0].evidence = [invalid];
    assert.throws(() => validateReview(draft, docs, guidance));
  }
  const longText = 'Original document facts: NGN 2,500,000, 12 March 2026. '.repeat(200).trim();
  const chunks = documentPassages([{ ...docs[0], text: longText }]);
  assert.equal(chunks.map(chunk => chunk.quote).join(' '), longText);
  assert.ok(chunks.every(chunk => chunk.quote.length >= 8 && chunk.quote.length <= 400 && longText.includes(chunk.quote)));
});

test('both provider passes receive complete documents and a passage catalogue, and returned reports contain exact resolved quotations', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    if (url.startsWith('https://www.gov.uk/')) throw new Error('Guidance unavailable');
    const body = JSON.parse(options.body); calls.push(body);
    const draft = fixture(); draft.findings[0].policyEvidence = [];
    for (const item of [...draft.criteria, ...draft.findings]) item.evidence = item.evidence.map(evidence => ({ documentId: evidence.documentId, excerptId: `${evidence.documentId}-passage-1` }));
    return providerResponse(draft);
  };
  try {
    const response = await POST(request(payload));
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.ok(call.messages[0].content.includes('documentEvidenceCatalogue'));
      assert.ok(call.messages[0].content.includes(docs[0].text));
      assert.match(call.system, /Do not generate a quote field/);
      assert.equal(call.output_config.format.schema.properties.findings.items.properties.evidence.items.properties.quote, undefined);
    }
    const { report } = await response.json();
    assert.equal(report.findings[0].evidence[0].quote, docs[1].text);
    assert.equal(report.findings[0].evidence[0].excerptId, undefined);
  } finally { global.fetch = original; }
});

test('official source retrieval uses only configured public URLs, with safe unavailable/unsupported outcomes', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, options }); return new Response('<main><h1>Visa guidance</h1><p>' + 'Funds and documents. '.repeat(25) + '</p></main>', { headers: { 'content-type': 'text/html' } }); };
  try {
    const retrieved = await getConsularGuidance('United Kingdom', 'Visit / Tourist Visa');
    assert.equal(retrieved.status, 'available');
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.startsWith('https://www.gov.uk/'));
    assert.equal(calls[0].options.redirect, 'error');
    assert.equal(calls[0].options.cache, 'no-store');
    assert.equal((await getConsularGuidance('https://untrusted.test', 'Visit / Tourist Visa')).status, 'unsupported');
    assert.equal(calls.length, 1);
    global.fetch = async () => { throw new Error('Network unavailable'); };
    assert.equal((await getConsularGuidance('Canada', 'Study Permit')).status, 'unavailable');
  } finally { global.fetch = original; }
});

test('request validation rejects duplicate IDs, empty documents, oversized text and invalid routes before any provider call', async () => {
  const original = global.fetch;
  global.fetch = async () => { throw new Error('Provider must not be called'); };
  try {
    assert.equal((await POST(request('{'))).status, 400);
    assert.equal((await POST(request({}))).status, 400);
    assert.equal((await POST(request({ ...payload, country: 'Invalid' }))).status, 400);
    assert.equal((await POST(request({ ...payload, documents: [] }))).status, 400);
    assert.equal((await POST(request({ ...payload, documents: [docs[0], docs[0]] }))).status, 400);
    assert.equal((await POST(request({ ...payload, documents: Array(7).fill(docs[0]) }))).status, 400);
    assert.equal((await POST(request({ ...payload, documents: [{ ...docs[0], text: 'x'.repeat(MAX_ASSESSMENT_CHARS + 1) }] }))).status, 413);
    assert.equal((await POST(request({ ...payload, documents: [{ ...docs[0], text: 'x'.repeat(MAX_ASSESSMENT_CHARS) }, docs[1]] }))).status, 413);
    assert.equal((await POST(request(payload, undefined, { 'content-length': '750001' }))).status, 413);
    assert.equal((await POST(request(' '.repeat(750001)))).status, 413);
  } finally { global.fetch = original; }
});

test('API sends all documents and context through two passes and returns only an evidence-checked private report', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    if (url.startsWith('https://www.gov.uk/')) return new Response(`<main><h1>Guidance</h1>${source.text} ${'Read the relevant route guidance. '.repeat(20)}</main>`, { headers: { 'content-type': 'text/html' } });
    const body = JSON.parse(options.body);
    calls.push(body);
    return providerResponse(fixture());
  };
  try {
    const response = await POST(request(payload));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const { report } = await response.json();
    assert.equal(report.score, null);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].output_config.format.type, 'json_schema');
    assert.ok(calls[0].messages[0].content.includes(docs[0].text));
    assert.ok(calls[0].messages[0].content.includes(docs[1].text));
    assert.ok(calls[0].messages[0].content.includes('Nigeria'));
    assert.ok(calls[1].messages[0].content.includes('Independently audit'));
    assert.ok(calls[1].messages[0].content.includes(docs[1].text));
  } finally { global.fetch = original; }
});

test('successive reviews work under one paid session without contacting Flutterwave and retired flags cannot unlock unpaid reviews', async () => {
  const originalFetch = global.fetch;
  const savedMode = process.env.NODE_ENV;
  const savedBypass = process.env.CONSULAR_DEV_BYPASS_PAYMENT;
  let providerCalls = 0;
  global.fetch = async url => {
    if (url.startsWith('https://www.gov.uk/')) throw new Error('Guidance unavailable');
    assert.equal(url, 'https://api.anthropic.com/v1/messages', 'Assessment must not contact the payment provider');
    providerCalls++;
    const draft = fixture(); draft.findings[0].policyEvidence = [];
    return providerResponse(draft);
  };
  try {
    const paidCookie = `${ACCESS_COOKIE}=${signToken('access', 'successive-paid-reviews')}`;
    for (let index = 0; index < 2; index++) {
      const response = await POST(request(payload, undefined, { cookie: paidCookie }));
      assert.equal(response.status, 200);
      assert.ok((await response.json()).report);
    }
    assert.equal(providerCalls, 4);
    const expiredCookie = `${ACCESS_COOKIE}=${signToken('access', 'expired-review', -1)}`;
    const expired = await POST(request(payload, undefined, { cookie: expiredCookie }));
    assert.equal(expired.status, 402);
    assert.equal(providerCalls, 4);
    process.env.NODE_ENV = 'development';
    process.env.CONSULAR_DEV_BYPASS_PAYMENT = 'true';
    for (let index = 0; index < 2; index++) {
      const response = await POST(request(payload, undefined, { cookie: '' }));
      assert.equal(response.status, 402);
      assert.equal((await response.json()).report, undefined);
    }
    assert.equal(providerCalls, 4);
  } finally {
    global.fetch = originalFetch;
    process.env.NODE_ENV = savedMode;
    if (savedBypass === undefined) delete process.env.CONSULAR_DEV_BYPASS_PAYMENT;
    else process.env.CONSULAR_DEV_BYPASS_PAYMENT = savedBypass;
  }
});

test('pre-assessment accepts the 60,000-character boundary without truncating either review pass', async () => {
  const original = global.fetch;
  const longText = docs[0].text + 'x'.repeat(MAX_ASSESSMENT_CHARS - docs[0].text.length - docs[1].text.length);
  assert.equal(longText.length + docs[1].text.length, MAX_ASSESSMENT_CHARS);
  const calls = [];
  global.fetch = async (url, options) => {
    if (url.startsWith('https://www.gov.uk/')) return new Response(`<main><h1>Guidance</h1>${source.text} ${'Read the relevant route guidance. '.repeat(20)}</main>`, { headers: { 'content-type': 'text/html' } });
    const body = JSON.parse(options.body);
    calls.push(body.messages[0].content);
    return providerResponse(fixture());
  };
  try {
    const response = await POST(request({ ...payload, documents: [{ ...docs[0], text: longText }, docs[1]] }));
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(content => content.includes(longText)));
  } finally { global.fetch = original; }
});

test('failed, truncated and fabricated AI reports never become fallback scores or leak provider errors', async () => {
  const original = global.fetch;
  try {
    for (const mode of ['unavailable', 'truncated', 'fabricated', 'invalid-json', 'timeout']) {
      global.fetch = async url => {
        if (url.startsWith('https://www.gov.uk/')) throw new Error('Guidance unavailable');
        if (mode === 'timeout') throw new DOMException('secret timeout detail', 'TimeoutError');
        if (mode === 'unavailable') return Response.json({ error: { message: 'secret provider detail' } }, { status: 401 });
        if (mode === 'truncated') return providerResponse(fixture(), 'max_tokens');
        if (mode === 'invalid-json') return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'not json' }] });
        const draft = fixture(); draft.findings[0].evidence[0].quote = 'Completely fabricated financial evidence';
        return providerResponse(draft);
      };
      const response = await POST(request(payload));
      assert.equal(response.status, mode === 'unavailable' ? 503 : mode === 'timeout' ? 504 : 502);
      const body = await response.json();
      assert.equal(body.report, undefined);
      assert.match(body.requestId, /^[a-f0-9-]{36}$/);
      assert.equal(body.code, mode === 'unavailable' ? 'provider_unavailable' : mode === 'timeout' ? 'review_timeout' : mode === 'fabricated' ? 'report_validation_failed' : 'review_incomplete');
      assert.ok(!JSON.stringify(body).includes('secret provider detail'));
      assert.ok(!JSON.stringify(body).includes('secret timeout detail'));
      if (mode === 'timeout') {
        assert.equal(body.code, 'review_timeout');
        assert.equal(body.error, 'Session timeout, please retry');
        assert.ok(!body.error.includes('evidence-checked'));
      }
    }
  } finally { global.fetch = original; }
});

test('an output-limit interruption is regenerated once with more space and then independently verified', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    if (url.startsWith('https://www.gov.uk/')) throw new Error('Guidance unavailable');
    const body = JSON.parse(options.body); calls.push(body);
    if (calls.length === 1) return providerResponse({ summary: 'Partial content must never be shown.' }, 'max_tokens');
    const draft = fixture(); draft.findings[0].policyEvidence = [];
    return providerResponse(draft);
  };
  try {
    const response = await POST(request(payload));
    assert.equal(response.status, 200);
    assert.deepEqual(calls.map(call => call.max_tokens), [7000, 14000, 7000]);
    assert.equal(calls[1].messages[0].content, calls[0].messages[0].content);
    assert.ok(calls[2].messages[0].content.includes('Independently audit'));
    const { report } = await response.json();
    assert.ok(!JSON.stringify(report).includes('Partial content'));
    assert.equal(report.proofreading[0].suggested, 'I plan to visit London');
  } finally { global.fetch = original; }
});

test('the output-limit retry budget is shared across passes and refusals are not retried', async () => {
  const original = global.fetch;
  try {
    for (const mode of ['truncated-across-passes', 'refusal']) {
      let calls = 0;
      global.fetch = async url => {
        if (url.startsWith('https://www.gov.uk/')) throw new Error('Guidance unavailable');
        calls++;
        const draft = fixture(); draft.findings[0].policyEvidence = [];
        return providerResponse(draft, mode === 'refusal' ? 'refusal' : calls === 2 ? 'end_turn' : 'max_tokens');
      };
      const response = await POST(request(payload));
      assert.equal(response.status, 502);
      assert.equal(calls, mode === 'refusal' ? 1 : 3);
      const body = await response.json();
      assert.equal(body.code, 'review_incomplete');
      assert.equal(body.report, undefined);
      assert.ok(!body.error.includes('Payment'));
    }
  } finally { global.fetch = original; }
});

test('an invalid verification report gets one repair attempt and only corrected evidence is returned', async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async url => {
    if (url.startsWith('https://www.gov.uk/')) return new Response(`<main><h1>Guidance</h1>${source.text} ${'Read the relevant route guidance. '.repeat(20)}</main>`, { headers: { 'content-type': 'text/html' } });
    calls++;
    const draft = fixture();
    if (calls === 2) draft.proofreading[0].original = 'An invented sentence that is not supplied';
    return providerResponse(draft);
  };
  try {
    const response = await POST(request(payload));
    assert.equal(response.status, 200);
    assert.equal(calls, 3);
    assert.equal((await response.json()).report.proofreading[0].original, 'I plans to visit London');
  } finally { global.fetch = original; }
});

test('report list failures identify the field and limit without exposing applicant text or accepting truncated results', () => {
  const cases = [
    ['documents', 6, draft => { draft.documents = Array(7).fill(draft.documents[0]); }],
    ['criteria', 5, draft => { draft.criteria = Array(6).fill(draft.criteria[0]); }],
    ['findings', 12, draft => { draft.findings = Array(13).fill(draft.findings[0]); }],
    ['proofreading', 12, draft => { draft.proofreading = Array(13).fill(draft.proofreading[0]); }],
    ['missingEvidence', 10, draft => { draft.missingEvidence = Array(11).fill('Private applicant detail'); }],
    ['questions', 8, draft => { draft.questions = Array(9).fill('Private applicant detail'); }],
    ['roadmap', 8, draft => { draft.roadmap = Array(9).fill('Private applicant detail'); }],
    ['limitations', 10, draft => { draft.limitations = Array(11).fill('Private applicant detail'); }],
    ['criteria[0].evidence', 6, draft => { draft.criteria[0].evidence = Array(7).fill(draft.criteria[0].evidence[0]); }],
    ['criteria[0].policyEvidence', 4, draft => { draft.criteria[0].policyEvidence = Array(5).fill(draft.findings[0].policyEvidence[0]); }],
    ['findings[0].evidence', 6, draft => { draft.findings[0].evidence = Array(7).fill(draft.findings[0].evidence[0]); }],
    ['findings[0].policyEvidence', 4, draft => { draft.findings[0].policyEvidence = Array(5).fill(draft.findings[0].policyEvidence[0]); }],
  ];
  for (const [field, max, edit] of cases) {
    const draft = fixture(); edit(draft);
    assert.throws(() => validateReview(draft, docs, guidance), error => {
      assert.ok(error.message.includes(`field ${field} has ${max + 1} items; maximum ${max}.`));
      assert.ok(!error.message.includes('Private applicant detail'));
      return true;
    });
  }
  const malformed = fixture(); malformed.limitations = null;
  assert.throws(() => validateReview(malformed, docs, guidance), /field limitations must be an array/);
});

test('oversized AI lists receive precise verification and repair feedback and still require a valid complete report', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    if (url.startsWith('https://www.gov.uk/')) throw new Error('Guidance unavailable');
    const body = JSON.parse(options.body); calls.push(body);
    const draft = fixture(); draft.findings[0].policyEvidence = [];
    if (calls.length < 3) draft.limitations = Array(11).fill('Only supplied text was reviewed.');
    return providerResponse(draft);
  };
  try {
    const response = await POST(request(payload));
    assert.equal(response.status, 200);
    assert.equal(calls.length, 3);
    for (const call of calls) {
      assert.match(call.system, /limitations maximum 10/);
      assert.match(call.system, /at most 6 evidence quotations and at most 4 policyEvidence/);
      assert.match(call.output_config.format.schema.properties.limitations.description, /0–10/);
    }
    for (const call of calls.slice(1)) assert.ok(call.messages[0].content.includes('field limitations has 11 items; maximum 10.'));
    assert.equal((await response.json()).report.proofreading[0].suggested, 'I plan to visit London');
  } finally { global.fetch = original; }
});

test('source outages permit a limited evidence review without an eligibility score', async () => {
  const original = global.fetch;
  global.fetch = async url => {
    if (url.startsWith('https://www.gov.uk/')) throw new Error('Official source unavailable');
    const draft = fixture(); draft.findings[0].policyEvidence = [];
    return providerResponse(draft);
  };
  try {
    const response = await POST(request(payload));
    assert.equal(response.status, 200);
    const { report } = await response.json();
    assert.equal(report.guidance.status, 'unavailable');
    assert.equal(report.score, null);
    assert.equal(report.guidance.sources.length, 0);
  } finally { global.fetch = original; }
});

const { validateAssessmentFiles, readAssessmentFiles, AssessmentAccessError } = load('src/lib/assessmentFiles.ts');
const { readConsularResponse } = load('src/lib/consularResponse.ts');
const documentReader = load('src/lib/documentText.ts');
const { validateOcrResult } = load('src/lib/documentOcr.ts');
const { POST: readScan } = load('src/app/api/document-ocr/route.ts');

test('selecting assessment files validates metadata without reading content or sending requests', () => {
  let reads = 0;
  const file = { name: 'scanned-deed.pdf', size: 100, text: () => { reads++; throw new Error('Must not read during selection'); }, arrayBuffer: () => { reads++; throw new Error('Must not read during selection'); } };
  validateAssessmentFiles([file]);
  assert.equal(reads, 0);
  assert.throws(() => validateAssessmentFiles([]), /Select/);
  assert.throws(() => validateAssessmentFiles(Array(7).fill(file)), /6 documents/);
  assert.throws(() => validateAssessmentFiles([{ ...file, size: 0 }]), /empty/);
  assert.throws(() => validateAssessmentFiles([{ ...file, size: 10 * 1024 * 1024 + 1 }]), /10MB/);
  assert.throws(() => validateAssessmentFiles([{ ...file, name: 'image.exe' }]), /Choose/);
});

test('Proofread reads selected TXT documents in full and rejects excess text and cancelled processing', async () => {
  const signal = new AbortController().signal;
  const files = docs.map(doc => new File([doc.text], doc.name));
  assert.deepEqual(await readAssessmentFiles(files, signal), docs);
  await assert.rejects(readAssessmentFiles([new File(['x'.repeat(60001)], 'long.txt')], signal), /60,000/);
  await assert.rejects(readAssessmentFiles([new File(['x'.repeat(40000)], 'one.txt'), new File(['y'.repeat(30000)], 'two.txt')], signal), /60,000/);
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(readAssessmentFiles(files, cancelled.signal), /abort/i);
});

test('Proofread processes an entire scan internally, propagates uncertainty and access expiry, and discards late results after cancellation', async () => {
  const originalReader = documentReader.extractDocumentText, originalFetch = global.fetch;
  documentReader.extractDocumentText = async () => { throw new documentReader.ScannedPdfError(1); };
  const file = new File(['synthetic'], 'deed.pdf');
  const scan = { text: '[Page 1]\nDEED OF ASSIGHMENT\nPlot [unclear], Lagos', notes: ['Page 1: Plot number is unclear.'], pageCount: 1 };
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, options }); return Response.json(scan); };
  try {
    const documents = await readAssessmentFiles([file], new AbortController().signal);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/document-ocr');
    assert.equal(calls[0].options.body, file);
    assert.deepEqual(documents, [{ id: 'document-1', name: 'deed.pdf', text: scan.text, extraction: 'ocr', ocrNotes: scan.notes }]);
    assert.equal(documents[0].ocrConfirmed, undefined, 'Must not claim a user checked the text');
    global.fetch = async () => Response.json({ error: 'Payment required' }, { status: 402 });
    await assert.rejects(readAssessmentFiles([file], new AbortController().signal), AssessmentAccessError);
    global.fetch = async () => Response.json({ code: 'review_timeout', error: 'Session timeout, please retry' }, { status: 504 });
    await assert.rejects(readAssessmentFiles([file], new AbortController().signal), error => error.message === 'Session timeout, please retry');
    const controller = new AbortController();
    global.fetch = async () => { controller.abort(); return Response.json(scan); };
    await assert.rejects(readAssessmentFiles([file], controller.signal), /abort/i);
  } finally { documentReader.extractDocumentText = originalReader; global.fetch = originalFetch; }
});

test('consular responses preserve API JSON and turn hosting HTML, empty and malformed bodies into controlled HTTP diagnostics', async () => {
  const report = { report: { summary: 'Synthetic review' }, requestId: 'synthetic-reference' };
  assert.deepEqual(await readConsularResponse(Response.json(report), 'review'), report);
  const failure = { error: 'Provider is busy', code: 'provider_unavailable' };
  assert.deepEqual(await readConsularResponse(Response.json(failure, { status: 503 }), 'review'), failure);

  for (const [status, expected] of [[413, /upload size/], [403, /blocked/], [404, /deployment/], [405, /deployment/], [429, /Too many requests/], [502, /temporarily unavailable/], [503, /temporarily unavailable/], [200, /unexpected response/]]) {
    for (const service of ['scan', 'review']) {
      const endpoint = service === 'scan' ? '/api/document-ocr' : '/api/ai-consular-check';
      await assert.rejects(readConsularResponse(new Response('<html><h1>Private proxy details</h1></html>', { status, headers: { 'content-type': 'text/html' } }), service), error => {
        assert.match(error.message, expected);
        assert.ok(error.message.includes(`${endpoint}, HTTP ${status}`));
        assert.ok(!/Private proxy|Unexpected token|<html>/.test(error.message));
        return true;
      });
    }
  }
  for (const body of ['', '{', 'null', '[]']) {
    await assert.rejects(readConsularResponse(new Response(body), 'scan'), /unexpected response.*HTTP 200/);
  }
  for (const status of [408, 504]) {
    const timeout = await readConsularResponse(new Response('<html>Gateway timeout</html>', { status }), 'scan');
    assert.equal(timeout.code, 'review_timeout');
    assert.match(timeout.error, /timed out/);
    assert.ok(timeout.error.includes(`HTTP ${status}`));
  }
});

test('Proofread handles production HTML upload failures and access expiry without exposing parser errors or accepting partial documents', async () => {
  const originalReader = documentReader.extractDocumentText, originalFetch = global.fetch;
  documentReader.extractDocumentText = async () => { throw new documentReader.ScannedPdfError(1); };
  const file = new File(['synthetic'], 'PROOF OF FUNDS.pdf');
  try {
    for (const status of [401, 402]) {
      global.fetch = async () => new Response('<html>Payment required</html>', { status });
      await assert.rejects(readAssessmentFiles([file], new AbortController().signal), AssessmentAccessError);
    }
    for (const status of [403, 413, 502]) {
      global.fetch = async () => new Response('<html>Private proxy details</html>', { status });
      await assert.rejects(readAssessmentFiles([file], new AbortController().signal), error => {
        assert.ok(error.message.startsWith('PROOF OF FUNDS.pdf: '));
        assert.ok(error.message.includes(`/api/document-ocr, HTTP ${status}`));
        assert.ok(!/Private proxy|Unexpected token|<html>/.test(error.message));
        return true;
      });
    }
    global.fetch = async () => new Response('<html>Gateway timeout</html>', { status: 504 });
    await assert.rejects(readAssessmentFiles([file], new AbortController().signal), error => /timed out/.test(error.message) && !error.message.includes(file.name));
    global.fetch = async () => new Response('<html>Unexpected success page</html>');
    await assert.rejects(readAssessmentFiles([file], new AbortController().signal), /unexpected response.*HTTP 200/);
  } finally { documentReader.extractDocumentText = originalReader; global.fetch = originalFetch; }
});

test('scan reader requires every physical page, preserves original facts, rejects unreadable or truncated data and withholds unchecked-scan scores', () => {
  const pages = [{ page: 1, status: 'readable', text: 'DEED OF ASSIGHMENT\nNGN 2,500,000\n12 March 2026', notes: [] }, { page: 2, status: 'partial', text: 'Plot [unclear], Lagos', notes: ['Plot number is obscured.'] }];
  const result = validateOcrResult({ pages }, 2);
  assert.ok(result.text.includes('DEED OF ASSIGHMENT\nNGN 2,500,000\n12 March 2026'));
  assert.ok(result.notes.some(note => note.includes('Plot number')));
  assert.throws(() => validateOcrResult({ pages: pages.slice(0,1) }, 2), /every page/);
  assert.throws(() => validateOcrResult({ pages: [pages[0], pages[0]] }, 2), /page information/);
  assert.throws(() => validateOcrResult({ pages: [pages[0], { ...pages[1], status: 'unreadable' }] }, 2), /Page 2 is too unclear/);
  assert.throws(() => validateOcrResult({ pages: [{ ...pages[0], text: 'x'.repeat(60001) }] }, 1), /60,000/);
  const signaturePage = { page: 2, status: 'signature_only', text: '', notes: ['Signature mark at the bottom-right signing area; name is not legible.'] };
  const signed = validateOcrResult({ pages: [pages[0], signaturePage] }, 2);
  assert.ok(signed.text.includes('[Page 2]\n[Signature mark; signer and authenticity unverified]'));
  assert.ok(signed.notes.some(note => note.includes('bottom-right')));
  assert.throws(() => validateOcrResult({ pages: [pages[0], { ...signaturePage, text: 'Guessed signer name' }] }, 2), /conflicting signature/);
  assert.throws(() => validateOcrResult({ pages: [{ ...signaturePage, page: 1 }] }, 1), /No readable text/);
  const draft = validateReview(fixture(), docs, guidance);
  draft.criteria.forEach(criterion => { criterion.status = 'supported'; });
  assert.ok(finalizeReview(draft, guidance).score !== null);
  const report = finalizeReview(draft, guidance, [{ ...docs[0], extraction: 'ocr', ocrNotes: [] }]);
  assert.equal(report.score, null);
  assert.ok(report.limitations.some(value => value.includes('not been independently confirmed')));
  assert.ok(finalizeReview(draft, guidance, [{ ...docs[0], extraction: 'ocr', ocrNotes: signed.notes }]).limitations.some(value => value.includes('bottom-right')));
});

test('signature and unclear-handwriting annotations cannot become proofreading corrections', () => {
  const marker = '[Signature mark; signer and authenticity unverified]';
  const documents = [{ ...docs[0], text: `${docs[0].text}\nWitness name: [unclear]\n${marker}` }, docs[1]];
  const draft = fixture();
  draft.proofreading.push(
    { documentId: 'document-1', original: '[unclear]', suggested: '[clear]', explanation: 'Attempted interpretation of an unclear field.' },
    { documentId: 'document-1', original: marker, suggested: marker.slice(1,-1), explanation: 'Attempted formatting of a signature annotation.' },
  );
  const report = validateReview(draft, documents, guidance);
  assert.equal(report.proofreading.length, 1);
  assert.equal(report.proofreading[0].suggested, 'I plan to visit London');
  assert.ok(report.limitations.some(value => value.includes('reading annotations')));
});

test('scan endpoint validates paid access and real PDF contents, sends all original pages, and never accepts incomplete provider output', async () => {
  const { PDFDocument } = require('pdf-lib');
  const pdf = await PDFDocument.create(); pdf.addPage(); pdf.addPage();
  const bytes = Buffer.from(await pdf.save());
  const scanRequest = (body, paid = true, headers = {}) => new NextRequest('https://site.test/api/document-ocr', { method: 'POST', headers: { 'content-type': 'application/pdf', ...(paid ? { cookie: `${ACCESS_COOKIE}=${signToken('access', `scan-${Math.random()}`)}` } : {}), ...headers }, body });
  const original = global.fetch;
  global.fetch = async () => { throw new Error('Provider must not be called'); };
  try {
    assert.equal((await readScan(scanRequest(bytes, false))).status, 402);
    assert.equal((await readScan(scanRequest(Buffer.from('not PDF')))).status, 400);
    assert.equal((await readScan(scanRequest(bytes, true, { 'content-length': '10485761' }))).status, 413);
    let sent;
    const pages = [{ page: 1, status: 'readable', text: 'Deed text', notes: [] }, { page: 2, status: 'readable', text: 'Witness text', notes: [] }];
    global.fetch = async (url, options) => { sent = JSON.parse(options.body); return providerResponse({ pages }); };
    const response = await readScan(scanRequest(bytes));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(Buffer.from(sent.messages[0].content[0].source.data, 'base64'), bytes);
    assert.equal((await response.json()).pageCount, 2);
    global.fetch = async () => providerResponse({ pages: pages.slice(0, 1) });
    assert.equal((await readScan(scanRequest(bytes))).status, 422);
    global.fetch = async () => providerResponse({ pages }, 'max_tokens');
    assert.equal((await readScan(scanRequest(bytes))).status, 502);
    global.fetch = async () => { throw new DOMException('secret timeout detail', 'TimeoutError'); };
    const timeout = await readScan(scanRequest(bytes));
    assert.equal(timeout.status, 504);
    assert.equal((await timeout.json()).error, 'Session timeout, please retry');
  } finally { global.fetch = original; }
});
