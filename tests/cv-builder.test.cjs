/* eslint-disable @typescript-eslint/no-require-imports -- Compile project TypeScript with the existing Node test runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative) {
  const filename = path.join(root, relative);
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const { emptyCvBuilder, emptyHistory, emptyEducation, cvBuilderIssues, buildCvDraft, cvCountryProfile } = load('src/lib/cvBuilder.ts');
const { worldCountries } = load('src/data/countries.ts');
function fixture() {
  const data = emptyCvBuilder();
  Object.assign(data, { name: 'José Adé', email: 'jose@example.test', phone: '+234 807 000 0000', location: 'Lagos, Nigeria', target: 'Data analyst', summary: 'Analyst with experience delivering operational reports.', skills: 'Python\nSQL\nStatistical analysis', linkedin: 'https://linkedin.com/in/synthetic-example', researchInterests: 'Research into reproducible statistical methods.' });
  Object.assign(data.education[0], { title: 'BSc Mathematics', organisation: 'Example University', location: 'Lagos', start: '2018-09', end: '2022-06', grade: 'First class', details: 'Statistics and numerical methods.' });
  return data;
}
test('core CV fields are validated and an applicant without employment or publications can build a complete entry-level draft', () => {
  assert.ok(cvBuilderIssues(emptyCvBuilder()).length > 0);
  const data = fixture();
  const draft = buildCvDraft(data, 'Canada');
  assert.equal([draft.content.name, ...draft.content.contact, ...draft.content.sections.map(section => `${section.heading}\n${section.body}`)].join('\n\n'), draft.text, 'Template content preserves the complete validated draft');
  assert.equal(draft.paperSize, 'Letter');
  for (const value of [data.name, data.email, data.phone, data.location, data.target, data.summary, data.skills, data.education[0].title, data.education[0].organisation]) assert.ok(draft.text.includes(value));
  assert.ok(!draft.text.includes('WORK EXPERIENCE'));
  assert.ok(!draft.text.includes('PUBLICATIONS'));
  assert.ok(!draft.text.includes('REFERENCES'));
  assert.ok(!draft.text.includes('Available on request'));
  data.kind = 'academic'; data.summary = '';
  assert.match(buildCvDraft(data, 'United Kingdom').text, /RESEARCH INTERESTS/);
});
test('academic drafts retain scholarly sections, thesis details, research dates and referee facts while job drafts exclude inactive academic fields', () => {
  const data = fixture();
  data.kind = 'academic';
  Object.assign(data.education[0], { thesis: 'Reproducible statistics', supervisor: 'Dr Synthetic Mentor' });
  const fields = { publications: 'Adé, J. (2025). Published paper. Journal of Examples. DOI: 10.example/test', workingPapers: 'Under review: Robust methods, submitted September 2026.', presentations: 'Poster: Methods, Example Conference, June 2026.', grants: 'Example Fund, 2025, co-investigator, ₦500,000.', service: 'Journal reviewer, 2025–2026.', patents: 'Example method, pending application EXAMPLE-1.', projects: 'Dataset project, 2024.', certifications: 'Methods certificate, Example Institute, 2025.', awards: 'Example scholarship, 2022.', volunteering: 'Science outreach, 2024.', memberships: 'Example Society, member since 2023.', training: 'Teaching workshop, 2025.', languages: 'English — fluent; German — B2.' };
  fields.additional = 'Application-specific information: available for fieldwork from January 2027.';
  Object.assign(data, fields);
  data.research = [{ ...emptyHistory('research'), title: 'Research assistant', organisation: 'Example Lab', start: '2023-01', end: '2024-06', details: 'Analysed 120 observations using R.' }];
  data.teaching = [{ ...emptyHistory('teaching'), title: 'Teaching assistant', organisation: 'Example University', start: '2024-09', current: true, details: 'Taught statistics to 30 undergraduates.' }];
  data.referenceMode = 'include';
  data.referees = [{ id: 'referee', name: 'Dr Synthetic Mentor', position: 'Lecturer', organisation: 'Example University', email: 'mentor@example.test', phone: '+234 800 000 0000' }];
  const text = buildCvDraft(data, 'United Kingdom').text;
  for (const value of Object.values(fields)) assert.ok(text.includes(value));
  for (const value of ['Thesis / dissertation: Reproducible statistics', 'Supervisor: Dr Synthetic Mentor', 'Analysed 120 observations using R.', 'Taught statistics to 30 undergraduates.', 'mentor@example.test', 'Jan 2023 – Jun 2024']) assert.ok(text.includes(value));
  assert.ok(!text.includes('PROFESSIONAL SUMMARY'));
  data.kind = 'job'; data.referenceMode = 'omit'; data.orcid = 'malformed inactive academic URL';
  const jobText = buildCvDraft(data, 'Canada').text;
  for (const value of [fields.publications, fields.workingPapers, fields.grants, 'mentor@example.test', 'Thesis / dissertation', 'Taught statistics to 30 undergraduates.']) assert.ok(!jobText.includes(value));
});
test('malformed contacts, partial entries, reversed dates and incomplete requested references block generation', () => {
  for (const change of [
    data => { data.email = 'invalid'; }, data => { data.phone = 'abc'; }, data => { data.website = 'javascript:alert(1)'; },
    data => { data.education = []; }, data => { data.education[0].end = '2017-09'; }, data => { data.education[0].start = '2020-13'; },
    data => { data.employment = [emptyHistory('blank')]; },
    data => { data.referenceMode = 'include'; },
    data => { data.referenceMode = 'include'; data.referees = [{ id: 'ref', name: 'Mentor', position: '', organisation: '', email: 'invalid', phone: '' }]; },
  ]) { const data = fixture(); change(data); assert.throws(() => buildCvDraft(data, 'Canada')); }
});
test('education and employment are ordered most recent first without mutating supplied entries or printing stale hidden end dates', () => {
  const data = fixture();
  data.education.push({ ...emptyEducation('masters'), title: 'MSc Statistics', organisation: 'Example University', start: '2024-09', end: '2027-06', current: true });
  data.employment = [
    { ...emptyHistory('old'), title: 'Earlier analyst', organisation: 'Earlier Employer', start: '2021-01', end: '2022-06', details: 'Built monthly reports.' },
    { ...emptyHistory('current'), title: 'Current analyst', organisation: 'Current Employer', start: '2023-04', end: '2020-01', current: true, details: 'Saved ₦500,000 annually.' },
  ];
  const original = JSON.stringify(data);
  const text = buildCvDraft(data, 'Germany').text;
  assert.ok(text.indexOf('MSc Statistics') < text.indexOf('BSc Mathematics'));
  assert.ok(text.indexOf('Current analyst') < text.indexOf('Earlier analyst'));
  assert.ok(text.includes('Present (expected completion: Jun 2027)'));
  assert.ok(text.includes('Apr 2023 – Present'));
  assert.ok(!text.includes('Jan 2020'));
  assert.equal(JSON.stringify(data), original);
});
test('country profiles adapt paper, labels and optional fields, and unsupported destinations explicitly use international guidance', () => {
  const data = fixture(); data.workAuthorization = 'Work authorisation supplied by applicant';
  assert.ok(buildCvDraft(data, 'Germany').text.includes(data.workAuthorization));
  assert.ok(!buildCvDraft(data, 'Canada').text.includes(data.workAuthorization));
  assert.match(cvCountryProfile('Germany', 'job').languageHint, /CEFR/);
  assert.equal(cvCountryProfile('United States', 'academic').paperSize, 'Letter');
  assert.match(cvCountryProfile('United Kingdom', 'academic').guidance, /job résumé length guidance does not apply/);
  assert.match(cvCountryProfile('Nigeria', 'job').guidance, /not been verified/);
  assert.match(cvCountryProfile('Nigeria', 'academic').guidance, /not been verified/);
  for (const country of worldCountries) for (const kind of ['job', 'academic']) {
    data.kind = kind;
    const draft = buildCvDraft(data, country);
    assert.ok(['Letter', 'A4'].includes(draft.paperSize));
    assert.ok(draft.text.includes(data.name));
    assert.ok(cvCountryProfile(country, kind).guidance.length > 0);
  }
});
