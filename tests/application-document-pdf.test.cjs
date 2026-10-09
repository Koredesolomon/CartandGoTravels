/* eslint-disable @typescript-eslint/no-require-imports -- Compile the project's TypeScript with the existing Node test runtime. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(filename) {
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod.require = request => {
    const local = path.resolve(path.dirname(filename), request + '.ts');
    return request.startsWith('.') && fs.existsSync(local) ? load(local) : Module.prototype.require.call(mod, request);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return mod.exports;
}
const { createApplicationDocumentPdf } = load(path.join(root, 'src/lib/applicationDocumentPdf.ts'));
const { cvTemplates } = load(path.join(root, 'src/lib/cvTemplates.ts'));
const fontBytes = new Uint8Array(fs.readFileSync(path.join(root, 'public/fonts/NotoSans-Regular.ttf')));
const boldFontBytes = new Uint8Array(fs.readFileSync(path.join(root, 'public/fonts/NotoSans-Bold.ttf')));

test('country paper size and Academic CV title are carried into the downloaded PDF', async () => {
  const { PDFDocument } = require('pdf-lib');
  for (const [paperSize, expected] of [['Letter', [612, 792]], ['A4', [595.28, 841.89]]]) {
    const bytes = await createApplicationDocumentPdf({ kind: 'CV', title: 'Academic CV', name: 'José Adé', text: 'José Adé\nResearch interests: statistics.', paperSize, fontBytes });
    const pdf = await PDFDocument.load(bytes);
    assert.match(pdf.getTitle(), /^Academic CV/);
    assert.deepEqual([pdf.getPage(0).getWidth(), pdf.getPage(0).getHeight()], expected);
  }
});

test('every CV template produces a distinct layout while preserving complete job and academic evidence across pages', async () => {
  const canvas = require('@napi-rs/canvas');
  global.DOMMatrix = canvas.DOMMatrix; global.Path2D = canvas.Path2D; global.ImageData = canvas.ImageData;
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const { createHash } = require('node:crypto');
  const longWord = 'ResearchReference'.repeat(35);
  const body = ['Saved ₦500,000 / €300 in annual costs.', longWord, ...Array.from({ length: 92 }, (_, index) => `Contribution ${index}: analysed genuine applicant-supplied results.`)].join('\n');
  const content = { name: 'José Adé', contact: ['jose@example.test | +234 807 000 0000 | Lagos, Nigeria', 'https://example.test/' + 'portfolio'.repeat(50)], sections: [
    { heading: 'RESEARCH INTERESTS / ACADEMIC PROFILE', body: 'Reproducible statistical methods.' },
    { heading: 'WORK EXPERIENCE', body },
    { heading: 'PUBLICATIONS', body: 'Adé, J. (2026). Example paper. Journal of Examples. Under review.' },
    { heading: 'REFEREES', body: 'Dr Example Mentor\nLecturer — Example University\nmentor@example.test' },
  ] };
  const text = [content.name, ...content.contact, ...content.sections.map(section => `${section.heading}\n${section.body}`)].join('\n\n');
  const appearances = new Set();
  for (const template of cvTemplates) for (const paperSize of ['A4', 'Letter']) {
    const bytes = await createApplicationDocumentPdf({ kind: 'CV', title: 'Academic CV', name: content.name, text, content, template: template.id, paperSize, fontBytes, boldFontBytes });
    const task = pdfjs.getDocument({ data: Uint8Array.from(bytes), disableFontFace: true });
    const pdf = await task.promise;
    try {
      assert.ok(pdf.numPages > 1);
      assert.equal((await pdf.getMetadata()).info.Subject, `CV template: ${template.name}`);
      const all = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        const width = page.getViewport({ scale: 1 }).width;
        const items = (await page.getTextContent()).items.filter(item => 'str' in item && item.str);
        assert.ok(items.some(item => item.str === `Page ${number} of ${pdf.numPages}`));
        for (const item of items) {
          assert.ok(item.transform[4] >= template.margin - 1 && item.transform[4] + item.width <= width - template.margin + 1, 'Text fits within horizontal margins');
          assert.ok(item.transform[5] >= 29, 'Text remains above the bottom edge');
        }
        all.push(...items.map(item => item.str).filter(value => !/^Page \d+ of \d+$/.test(value) && value !== `Academic CV · ${template.name}` && !(number > 1 && value === content.name)));
        if (number === 1 && paperSize === 'A4') {
          const operations = await page.getOperatorList();
          appearances.add(createHash('sha256').update(JSON.stringify(operations)).digest('hex'));
        }
      }
      const extracted = all.join('\n').replace(/\s/g, '');
      for (const value of [content.name, ...content.contact, ...content.sections.flatMap(section => [section.heading, section.body])]) assert.ok(extracted.includes(value.replace(/\s/g, '')), `Missing complete content in ${template.name}: ${value.slice(0, 80)}`);
    } finally { await task.destroy(); }
  }
  assert.equal(appearances.size, cvTemplates.length, 'Templates differ in rendered page layout, not just labels');
});

test('CV and cover letter PDFs preserve full Unicode drafts, long words and multipage text within printable margins', async () => {
  const canvas = require('@napi-rs/canvas');
  global.DOMMatrix = canvas.DOMMatrix;
  global.Path2D = canvas.Path2D;
  global.ImageData = canvas.ImageData;
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const longWord = 'QualificationReference'.repeat(25);
  const lines = Array.from({ length: 85 }, (_, index) => `Experience ${index}: Delivered project ${index} successfully.`);
  const text = ['José Adé', 'Target role / programme: Data analyst', '', 'WORK EXPERIENCE', 'Saved ₦500,000 / €300 in annual costs.', longWord, ...lines, '', 'EDUCATION AND CERTIFICATIONS', 'BSc Mathematics, University of Lagos, 2024'].join('\n');
  for (const kind of ['CV', 'Cover Letter']) {
    const bytes = await createApplicationDocumentPdf({ kind, name: 'José Adé', text, fontBytes });
    assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-');
    const task = pdfjs.getDocument({ data: Uint8Array.from(bytes), disableFontFace: true });
    const pdf = await task.promise;
    try {
      assert.ok(pdf.numPages > 1);
      const content = [];
      for (let index = 1; index <= pdf.numPages; index++) {
        const page = await pdf.getPage(index);
        const items = (await page.getTextContent()).items.filter(item => 'str' in item);
        assert.ok(items.some(item => item.str === `Page ${index} of ${pdf.numPages}`));
        for (const item of items) {
          assert.ok(item.transform[4] >= 47 && item.transform[4] + item.width <= 549, 'Text remains within horizontal margins');
          assert.ok(item.transform[5] >= 31, 'Text remains above the bottom edge');
        }
        content.push(...items.map(item => item.str));
      }
      const extracted = content.join('\n');
      for (const expected of ['José Adé', 'Saved ₦500,000 / €300 in annual costs.', 'WORK EXPERIENCE', 'EDUCATION AND CERTIFICATIONS', 'BSc Mathematics, University of Lagos, 2024', ...lines]) assert.ok(extracted.includes(expected), `Missing PDF text: ${expected}`);
      assert.ok(extracted.replace(/\s/g, '').includes(longWord));
    } finally { await task.destroy(); }
  }
  await assert.rejects(createApplicationDocumentPdf({ kind: 'CV', name: '', text: ' ', fontBytes }), /Build your document/);
});
