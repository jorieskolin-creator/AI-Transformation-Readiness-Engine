import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from '../node_modules/typescript/lib/typescript.js';

const sourcePath = new URL('../src/services/evidenceSupport.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
  },
}).outputText;

const dir = await mkdtemp(join(tmpdir(), 'aiTransformation-evidence-check-'));
const modulePath = join(dir, 'evidenceSupport.mjs');
await writeFile(modulePath, compiled, 'utf8');

const { verifyTextEvidenceSupport } = await import(`file://${modulePath}`);

const item = (quote) => ({
  count: 2,
  evidence_quotes: quote ? [{ quote, evidence_source: 'text' }] : [],
});

const sourceText = [
  'Teams run monthly AI value review meetings with engineering and finance.',
  'Service-area ownership is used in AI value realization reviews.',
].join('\n');

assert.equal(
  verifyTextEvidenceSupport(item('Teams run monthly AI value review meetings'), sourceText),
  'supported',
  'exact source quote should be supported'
);

assert.equal(
  verifyTextEvidenceSupport(item(undefined), sourceText),
  'missing',
  'scored finding without a quote should be missing'
);

assert.equal(
  verifyTextEvidenceSupport(item('Monthly AI review with finance and engineering teams'), sourceText),
  'weak',
  'mostly overlapping but non-exact quote should be weak'
);

assert.equal(
  verifyTextEvidenceSupport(item('Agents can execute production payments without review'), sourceText),
  'unsupported',
  'unrelated quote should be unsupported'
);

console.log('evidence-check unit tests passed');
