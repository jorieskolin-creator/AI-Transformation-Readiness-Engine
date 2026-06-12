import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from '../node_modules/typescript/lib/typescript.js';

const sourcePath = new URL('../src/services/reportTextService.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
  },
}).outputText;

const dir = await mkdtemp(join(tmpdir(), 'aiTransformation-report-rendering-'));
const modulePath = join(dir, 'reportTextService.mjs');
await writeFile(modulePath, compiled, 'utf8');

const {
  isInsufficientEvidenceReport,
  renderInlineMarkdownHtml,
  renderMarkdownSummaryHtml,
  softenVisualOnlySourceWording,
  strengthsSectionTitle,
} = await import(`file://${modulePath}`);

assert.equal(strengthsSectionTitle(false), 'Confirmed strengths');
assert.equal(strengthsSectionTitle(true), 'Source observations outside AI Transformation scope');
assert.equal(isInsufficientEvidenceReport('Insufficient evidence', 0, 'BLOCK'), true);
assert.equal(isInsufficientEvidenceReport('Adaptive / Value-creating', 90, 'GO'), false);
assert.equal(renderInlineMarkdownHtml('Tracked in *My Projects*'), 'Tracked in <em>My Projects</em>');

const html = renderMarkdownSummaryHtml([
  '**1. What the audit found:** The source contains *project activity* but no AI Transformation signal.',
  '',
  '**2. What is missing:** No AI governance or lifecycle evidence.',
  '',
  '**3. What is needed:** More source material.',
].join('\n'));

assert.ok(html.includes('<strong>1. What the audit found:</strong>'), 'bold markdown should become strong tags');
assert.ok(html.includes('<em>project activity</em>'), 'italic markdown should become em tags');
assert.ok(html.includes('class="summary-paragraph"'), 'summary should render as paragraph blocks');
assert.equal(html.includes('**'), false, 'raw bold markdown should not leak into exported HTML');
assert.equal(html.includes('*project activity*'), false, 'raw italic markdown should not leak into exported HTML');

const visualOnlyPhrase = softenVisualOnlySourceWording('Two submitted PDF documents returned zero extractable text, contributing no assessable evidence.');
assert.equal(visualOnlyPhrase.includes('contributing no assessable evidence'), false, 'visual-only PDFs should not be described as no assessable evidence');
assert.match(visualOnlyPhrase, /rendered page images were used where available/, 'visual-only PDFs should be described as visually assessed when images exist');

const reportViewSource = await readFile(new URL('../src/components/ReportView.tsx', import.meta.url), 'utf8');
assert.match(reportViewSource, />Why</, 'React report should render roadmap WHY context');
assert.match(reportViewSource, />What</, 'React report should render roadmap WHAT context');
assert.match(reportViewSource, />How</, 'React report should preserve action bullets as HOW');
assert.match(reportViewSource, /Source Registry, Usability &amp; Domain Packets/, 'React report should render source usability diagnostics');

const dashboardSource = await readFile(new URL('../src/components/DashboardComponents.tsx', import.meta.url), 'utf8');
assert.match(dashboardSource, />Why</, 'Dashboard roadmap should render WHY context');
assert.match(dashboardSource, />What</, 'Dashboard roadmap should render WHAT context');
assert.match(dashboardSource, />How</, 'Dashboard roadmap should preserve HOW action list');

const exportSource = await readFile(new URL('../src/services/exportService.ts', import.meta.url), 'utf8');
assert.match(exportSource, /roadmap-context-label">Why/, 'HTML export should render roadmap WHY context');
assert.match(exportSource, /roadmap-context-label">What/, 'HTML export should render roadmap WHAT context');
assert.match(exportSource, /roadmap-how-label">How/, 'HTML export should label action bullets as HOW');
assert.match(exportSource, /Source Registry, Usability &amp; Domain Packets/, 'HTML export should include source usability diagnostics');

console.log('report rendering unit tests passed');
