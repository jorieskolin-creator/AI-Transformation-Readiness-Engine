import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from '../node_modules/typescript/lib/typescript.js';

const compile = (source) => ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
  },
}).outputText;

const dir = await mkdtemp(join(tmpdir(), 'aiTransformation-tactic-grounding-'));
const tactics = [
  { id: 'TAC-OPS-001', canonical_name: 'AI Operating Rhythm' },
  { id: 'TAC-OPS-003', canonical_name: 'Launch-and-Learn Vertical Slice' },
  { id: 'TAC-ARCH-002', canonical_name: 'AI Release Control' },
  { id: 'TAC-RISK-001', canonical_name: 'Agent Behavioral Contract' },
  { id: 'TAC-DATA-003', canonical_name: 'Reusable Retrieval and Feature Patterns' }
];

await writeFile(
  join(dir, 'knowledge_base.mjs'),
  `export const AI_TACTICS_LOCAL = ${JSON.stringify(tactics)};\n`,
  'utf8'
);

const source = await readFile(new URL('../src/services/tacticGroundingService.ts', import.meta.url), 'utf8');
const modulePath = join(dir, 'tacticGroundingService.mjs');
await writeFile(
  modulePath,
  compile(source).replace("from '../knowledge_base'", "from './knowledge_base.mjs'"),
  'utf8'
);

const { sanitizeRoadmapTacticGrounding } = await import(`file://${modulePath}`);

const phase2 = {
  metrics: {},
  maturity_gaps: [
    '[A1] Missing: AI decision rights and operating rhythm are not documented.',
    '[B2] Missing: Prompt and model release versions are not controlled.',
    '[B4] Missing: Agent safety guardrails and behavioral boundaries are not tested.'
  ],
  antipattern_findings: [],
  silent_areas: ['Missing Capability: D5'],
};

const strategyData = {
  phase_3_strategy: {
    remediation_roadmap: [
      {
        phase: '1. Emerging',
        actions: [
          'Implement the AI operating rhythm and decision log [TAC-OPS-001]',
          'Version prompts, models, tools, datasets, and evaluation suites [TAC-ARCH-002]',
          'Define agent tool boundaries and human escalation paths [TAC-RISK-001]',
          'Create reusable retrieval patterns [TAC-DATA-003]',
          'Move measurement from activity-based to outcome-based AI Transformation reporting',
          'Evaluate embedded finance partner coverage to sustain product team growth'
        ]
      }
    ]
  }
};

const result = sanitizeRoadmapTacticGrounding(strategyData, phase2);
const actions = result.strategyData.phase_3_strategy.remediation_roadmap[0].actions;

assert.equal(result.adjustments.length, 2);
assert.ok(actions[0].includes('[TAC-OPS-001]'), 'operating rhythm action should stay grounded');
assert.ok(actions[1].includes('[TAC-ARCH-002]'), 'release control action should stay grounded');
assert.ok(actions[2].includes('[TAC-RISK-001]'), 'risk action should stay grounded');
assert.ok(actions[3].includes('[TAC-DATA-003]'), 'retrieval action should stay grounded from silent D5 evidence need');
assert.ok(actions.every(action => !action.includes('activity-based')), 'activity-to-outcome action should be removed without a matching finding');
assert.ok(actions.every(action => !action.includes('product team growth')), 'product-growth action should be removed without a matching finding');

console.log('tactic grounding unit tests passed');
