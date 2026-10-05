import { copyFileSync, cpSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("pdfjs-dist/package.json"));
// Some production hosts serve .mjs as text/plain, which module workers reject.
copyFileSync(join(packageRoot, "legacy/build/pdf.worker.min.mjs"), new URL("../public/pdf.worker.min.js", import.meta.url));
for (const directory of ["standard_fonts", "cmaps", "wasm"]) {
  cpSync(join(packageRoot, directory), new URL(`../public/pdf-assets/${directory}`, import.meta.url), { recursive: true });
}
