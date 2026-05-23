import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from '../node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../src/services/domainDiagnosisService.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
  },
}).outputText;

const dir = await mkdtemp(join(tmpdir(), 'aiTransformation-domain-diagnosis-'));
await writeFile(join(dir, 'knowledge_base.mjs'), `
export const BATCH_TITLES = {
  A: 'Adaptive Operating Model',
  B: 'Enterprise AI Architecture & Platform Readiness',
  C: 'AI Strategy, Governance & Value Realization',
  D: 'Data Foundations, Ownership & Accessibility',
  E: 'Business Capability & Service Architecture'
};
export const AI_CRITERIA = ['A','B','C','D','E'].flatMap(batch => [1,2,3,4,5].map(n => ({ id: batch + n, title: batch + n + ' maturity' })));
export const AI_ANTIPATTERNS = ['A','B','C','D','E'].flatMap(batch => [1,2,3,4,5].map(n => ({ id: batch + n, title: batch + n + ' anti-pattern' })));
`, 'utf8');
await writeFile(
  join(dir, 'domainDiagnosisService.mjs'),
  compiled.replace("from '../knowledge_base'", "from './knowledge_base.mjs'"),
  'utf8'
);

const { normalizeDomainDiagnosis } = await import(`file://${join(dir, 'domainDiagnosisService.mjs')}`);

const ids = ['A', 'B', 'C', 'D', 'E'].flatMap(batch => [1, 2, 3, 4, 5].map(n => `${batch}${n}`));
const empty = {
  count: 0,
  status: 'NOK',
  evidence: 'Document is silent.',
  evidence_quotes: [],
  reasoning: 'Not found.'
};
const phase1 = {
  maturity: Object.fromEntries(ids.map(id => [id, { ...empty }])),
  antipattern: Object.fromEntries(ids.map(id => [id, { ...empty }])),
};
phase1.maturity.A1 = {
  count: 1,
  status: 'Partial',
  evidence: 'General operating rhythm exists.',
  evidence_quotes: [{ quote: 'Operating cadence is monthly.', category: 'Process' }],
  reasoning: 'One criterion found.',
  evidence_check_status: 'supported',
};
phase1.maturity.D1 = {
  count: 1,
  status: 'Partial',
  evidence: 'Data owner exists.',
  evidence_quotes: [{ quote: 'Data owner exists.', category: 'Data' }],
  reasoning: 'One criterion found.',
  evidence_check_status: 'supported',
};
phase1.antipattern.E4 = {
  count: 2,
  status: 'Partial',
  evidence: 'Ownership disappears after pilot.',
  evidence_quotes: [{ quote: 'Ownership disappears after pilot.', category: 'Accountability' }],
  reasoning: 'Two criteria found.',
  evidence_check_status: 'supported',
};

const strategyData = {
  phase_3_strategy: {
    diagnosis: {
      primary_bottleneck: 'Generated text may be wrong.',
      root_causes: [],
      domain_diagnosis: {
        A: 'Wrong: talks about data foundations.',
        B: 'Wrong: talks about service ownership.',
      },
      confidence: 'low',
      confidence_rationale: 'Test.',
    },
  },
};

const normalized = normalizeDomainDiagnosis(strategyData, phase1, {
  category_scores: { A: 1, B: 0, C: 0, D: 1, E: 0 },
  silent_areas: [],
});

const diagnosis = normalized.phase_3_strategy.diagnosis.domain_diagnosis;
assert.equal(Object.keys(diagnosis).join(','), 'A,B,C,D,E');
assert.match(diagnosis.A, /A - Adaptive Operating Model/);
assert.match(diagnosis.B, /B - Enterprise AI Architecture & Platform Readiness/);
assert.match(diagnosis.C, /C - AI Strategy, Governance & Value Realization/);
assert.match(diagnosis.D, /D - Data Foundations, Ownership & Accessibility/);
assert.match(diagnosis.E, /E - Business Capability & Service Architecture/);
assert.match(diagnosis.A, /A1 maturity/);
assert.match(diagnosis.D, /D1 maturity/);
assert.match(diagnosis.E, /E4 anti-pattern/);
assert.doesNotMatch(diagnosis.A, /D1 maturity/);
assert.doesNotMatch(diagnosis.B, /E4 anti-pattern/);

console.log('domain diagnosis unit tests passed');
