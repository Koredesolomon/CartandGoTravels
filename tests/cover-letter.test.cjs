/* eslint-disable @typescript-eslint/no-require-imports -- Compile project TypeScript with the existing Node test runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(filename) {
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod.require = request => {
    const local = path.resolve(path.dirname(filename), request + '.ts');
    return request.startsWith('.') && fs.existsSync(local) ? load(local) : Module.prototype.require.call(mod, request);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const { emptyCoverLetter, coverLetterIssues, buildCoverLetter, coverLetterProfile, reviewCoverLetter } = load(path.join(root, 'src/lib/coverLetter.ts'));
const { worldCountries } = load(path.join(root, 'src/data/countries.ts'));
const today = new Date(2026, 9, 12);
function job() {
  return Object.assign(emptyCoverLetter(), {
    name: 'José Adé', email: 'jose@example.test', phone: '+234 807 000 0000', address: 'Lagos, Nigeria', organisation: 'Example Analytics Ltd', target: 'Data Analyst',
    background: 'I have three years of experience building operational reports in SQL and Python.', motivation: 'Your work on public-health data matches my interests.',
    achievements: '- Reduced reporting time by 40%\nTrained 6 colleagues in SQL',
  });
}

test('required fields, contact details and visa dates are validated', () => {
  assert.ok(coverLetterIssues(emptyCoverLetter()).length >= 8);
  assert.deepEqual(coverLetterIssues(job()), []);
  assert.ok(coverLetterIssues({ ...job(), email: 'invalid' }).includes('Enter a valid email address.'));
  assert.ok(coverLetterIssues({ ...job(), date: '2026-02-31' }).some(issue => /letter date/.test(issue)));
  const visa = { ...job(), kind: 'visa', target: 'Standard Visitor visa', travelFrom: '2027-05-10', travelTo: '2027-05-01', plans: 'London hotel', funding: 'My savings', ties: 'My job' };
  assert.ok(coverLetterIssues(visa).includes('Departure date cannot be before the arrival date.'));
  assert.ok(coverLetterIssues({ ...job(), kind: 'study' }).some(issue => /Career goals/.test(issue)));
  assert.throws(() => buildCoverLetter(emptyCoverLetter(), 'Canada', today));
});

test('letters follow each country’s paper, date, greeting and sign-off conventions', () => {
  const us = buildCoverLetter(job(), 'United States', today);
  assert.equal(us.paperSize, 'Letter');
  assert.match(us.text, /October 12, 2026/);
  assert.match(us.text, /Dear Hiring Manager,/);
  assert.match(us.text, /Sincerely,\n\nJosé Adé/);
  assert.ok(!us.text.includes('Re: Application'), 'US letters omit a subject line unless a reference is supplied');
  const uk = buildCoverLetter(job(), 'United Kingdom', today);
  assert.equal(uk.paperSize, 'A4');
  assert.match(uk.text, /12 October 2026/);
  assert.match(uk.text, /Dear Sir or Madam,[\s\S]*Yours faithfully,/);
  const named = buildCoverLetter({ ...job(), recipientName: 'Ms Okafor' }, 'United Kingdom', today);
  assert.match(named.text, /Dear Ms Okafor,[\s\S]*Yours sincerely,/);
  const de = buildCoverLetter({ ...job(), reference: 'DA-17', enclosures: 'CV\nDegree certificate', salary: '€55,000' }, 'Germany', today);
  assert.match(de.text, /Re: Application for the position of Data Analyst \(reference DA-17\)/);
  assert.match(de.text, /Kind regards,/);
  assert.match(de.text, /Enclosures:\n• CV\n• Degree certificate/);
  assert.match(de.text, /Salary expectations: €55,000/);
  for (const country of worldCountries) {
    const draft = buildCoverLetter(job(), country, today);
    assert.ok(['A4', 'Letter'].includes(draft.paperSize));
    assert.ok(draft.text.startsWith('José Adé\nLagos, Nigeria\njose@example.test | +234 807 000 0000'));
    assert.ok(coverLetterProfile(country, 'job').guidance);
  }
});

test('letters only contain supplied facts and keep each letter type’s required content', () => {
  const data = job();
  const draft = buildCoverLetter({ ...data, workAuthorization: 'I will require H-1B sponsorship.' }, 'United States', today);
  for (const value of [data.background, data.motivation, '• Reduced reporting time by 40%', '• Trained 6 colleagues in SQL', 'Example Analytics Ltd']) assert.ok(draft.text.includes(value), value);
  assert.ok(draft.text.includes('Right to work: I will require H-1B sponsorship.'));
  const study = buildCoverLetter({ ...data, kind: 'study', target: 'MSc Data Science', organisation: 'Example University', intake: 'September 2027', plans: 'After graduating I plan to work in health analytics.' }, 'Canada', today);
  assert.match(study.text, /Dear Admissions Committee,/);
  assert.match(study.text, /admission to the MSc Data Science at Example University for the September 2027 intake/);
  assert.equal(study.title, 'Admissions Cover Letter');
  const visa = buildCoverLetter({ ...data, kind: 'visa', target: 'Standard Visitor visa', organisation: 'UK Visas and Immigration', passportNumber: 'A00000000', travelFrom: '2027-05-01', travelTo: '2027-05-14', plans: 'I will stay at a London hotel.', funding: 'I will pay from my savings.', ties: 'I will return to my job in Lagos.', salary: 'Not for visas', enclosures: 'Bank statements' }, 'United Kingdom', today);
  assert.match(visa.text, /The Visa Officer\nUK Visas and Immigration/);
  assert.match(visa.text, /passport no\. A00000000/);
  assert.match(visa.text, /travel to the United Kingdom from 1 May 2027 to 14 May 2027 \(14 days\)/);
  assert.ok(buildCoverLetter(job(), 'Canada', today).notes.every(note => ['excellent', 'weak'].includes(note.type) && note.title && note.body));
  assert.ok(!visa.text.includes('Not for visas'));
  assert.equal(visa.title, 'Visa Cover Letter');
});

test('uploaded letters are reviewed against conventions without being changed', () => {
  const weak = 'To whom it may concern,\n\nI am a hard-working team player. I am 35 years old and married.\n\nYours sincerely,\nJosé';
  const checks = reviewCoverLetter(weak, 'United Kingdom', 'job');
  const titles = checks.filter(check => check.type === 'weak').map(check => check.title);
  for (const title of ['Length', 'Contact details', 'Date', 'Greeting', 'Subject line', 'Personal details', 'Generic claims', 'Evidence']) assert.ok(titles.includes(title), title);
  const mismatch = reviewCoverLetter('Dear Sir or Madam,\n\nText.\n\nYours sincerely,', 'United Kingdom', 'job');
  assert.ok(mismatch.some(check => check.title === 'Sign-off' && /Yours faithfully/.test(check.body)));
  const visa = reviewCoverLetter('Dear Visa Officer,\n\nI want to visit.\n\nYours sincerely,', 'France', 'visa');
  for (const title of ['Travel dates', 'Funding', 'Ties and return', 'Accommodation', 'Enclosures']) assert.ok(visa.some(check => check.title === title && check.type === 'weak'), title);
  const generated = buildCoverLetter({ ...job(), recipientName: 'Ms Okafor', reference: 'DA-17' }, 'United Kingdom', today).text;
  const clean = reviewCoverLetter(generated, 'United Kingdom', 'job').filter(check => check.type === 'weak').map(check => check.title);
  assert.deepEqual(clean.filter(title => title !== 'Length'), [], 'A generated letter passes its own structural checks');
});
