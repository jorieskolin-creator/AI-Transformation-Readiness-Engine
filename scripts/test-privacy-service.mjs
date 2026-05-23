import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from '../node_modules/typescript/lib/typescript.js';

const source = await readFile(new URL('../src/services/privacyService.ts', import.meta.url), 'utf8');
const constantsSource = await readFile(new URL('../src/constants.ts', import.meta.url), 'utf8');
const factCheckSource = await readFile(new URL('../src/services/factCheckService.ts', import.meta.url), 'utf8');
const qualityGateSource = await readFile(new URL('../src/services/qualityGateService.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
  },
}).outputText;

const dir = await mkdtemp(join(tmpdir(), 'aiTransformation-privacy-'));
const modulePath = join(dir, 'privacyService.mjs');
await writeFile(modulePath, compiled, 'utf8');

const {
  collectSourceOrganizationNames,
  scrubGeneratedText,
  scrubDiagnosticResultForPrivacy,
  findGeneratedReportPrivacyFindings,
} = await import(`file://${modulePath}`);

{
  const text = 'Prepared by Toni Eskolin, contact toni@example.com, +358 40 123 4567, 10.1.2.3, sk-testtokenabcdefghijklmnopqrstuvwxyz.';
  const scrubbed = scrubGeneratedText(text, { redactPersonNames: true });
  assert.match(scrubbed.text, /\[PERSON_NAME_REDACTED\]/);
  assert.match(scrubbed.text, /\[EMAIL_REDACTED\]/);
  assert.match(scrubbed.text, /\[PHONE_REDACTED\]/);
  assert.match(scrubbed.text, /\[IP_REDACTED\]/);
  assert.match(scrubbed.text, /\[TOKEN_REDACTED\]/);
}

{
  const text = 'AI Transformation Lead reviewed Google Cloud, Power BI, and Engineering Team evidence.';
  const scrubbed = scrubGeneratedText(text, { redactPersonNames: true });
  assert.equal(scrubbed.text, text, 'AI Transformation terms, cloud tools, and team/function labels should be preserved');
}

{
  const scrubbed = scrubGeneratedText('HUS has a AI Transformation process. HUS needs evidence.', {
    redactOrganizationName: 'HUS',
    redactPersonNames: false,
  });
  assert.equal(scrubbed.text, 'the assessed organization has a AI Transformation process. the assessed organization needs evidence.');
}

{
  const source = 'Clearly defined roles in Vivicta ensure customer needs are met. Vivicta’s IT function provides services. Service Area is a functional label.';
  const names = collectSourceOrganizationNames(source);
  assert.ok(names.includes('Vivicta'));
  assert.equal(names.includes('Service Area'), false);
  const scrubbed = scrubGeneratedText('Vivicta has a process and Vivicta’s service area owns it.', {
    redactOrganizationNames: names,
    redactPersonNames: false,
  });
  assert.equal(scrubbed.text, "the assessed organization has a process and the assessed organization's service area owns it.");
  assert.doesNotMatch(scrubbed.text, /\[ORGANIZATION_REDACTED\]/);
}

{
  const source = [
    'Current State evidence shows Model coverage and Value framing.',
    'Source confidence, Enterprise Architecture, Evidence Density, Governance Framework, and Target Model are repeated.',
    'Current State Model Value Source Enterprise Target Evidence Framework Process Governance.'
  ].join(' ');
  const names = collectSourceOrganizationNames(source);
  assert.deepEqual(names, [], 'domain vocabulary must not be collected as organization names');
}

{
  const scrubbed = scrubGeneratedText("[ORGANIZATION_REDACTED]'s process and [ORGANIZATION_REDACTED] evidence should read naturally.", {
    redactPersonNames: false,
  });
  assert.equal(scrubbed.text, "the assessed organization's process and the assessed organization evidence should read naturally.");
}

const result = {
  meta: { engine_version: 'test', timestamp: '2026-05-22', document_analyzed: 'HUS report', model_config: {} },
  phase_1_audit_logs: {
    maturity: {
      A1: {
        count: 0,
        status: 'NOK',
        evidence: 'Raw quote by Toni Eskolin should remain in audit evidence.',
        evidence_quotes: [{ quote: 'Raw quote by Toni Eskolin should remain in audit evidence.' }]
      }
    },
    antipattern: {}
  },
  evidence_check: { total_items: 0, supported_count: 0, weak_count: 0, unsupported_count: 0, missing_count: 0, downgraded_count: 0, rescan_count: 0, items: [], adjustments: [] },
  phase_2_validation: { metrics: {}, raw_counts: {}, maturity_gaps: [], antipattern_findings: [], verified_antipattern_absences: [], unknown_antipattern_absences: [], silent_areas: [], category_scores: {}, readiness_stage: 'Emerging' },
  phase_3_strategy: {
    executive_summary: 'Prepared by Toni Eskolin. HUS has contact toni@example.com.',
    executive_summaries: { transformation_lead: 'Prepared by Toni Eskolin.' },
    diagnosis: { primary_bottleneck: 'Owner: Toni Eskolin', root_causes: [], domain_diagnosis: {}, confidence: 'medium', confidence_rationale: '' },
    planning_decision: { decision: 'NO_GO', rationale: 'HUS needs more evidence.', safe_to_act_on: [], evidence_needed_before_action: [] },
    visual_scorecard: { headline: 'HUS scorecard', maturity_score: '', burden_score: '' },
    remediation_roadmap: []
  },
  quality_gate: { decision: 'WARN', blocking_reasons: [], warnings: ['Reviewer: Toni Eskolin'], notes: [], thresholds: {} },
};

const scrubbed = scrubDiagnosticResultForPrivacy(result, {
  redactPersonNames: true,
  redactOrganizationName: 'HUS',
  redactOrganizationNames: ['Vivicta']
});

assert.notEqual(scrubbed.result.phase_3_strategy.executive_summary, result.phase_3_strategy.executive_summary);
assert.match(scrubbed.result.phase_3_strategy.executive_summary, /\[PERSON_NAME_REDACTED\]/);
assert.doesNotMatch(scrubbed.result.phase_3_strategy.executive_summary, /\[ORGANIZATION_REDACTED\]/);
assert.match(scrubbed.result.phase_3_strategy.executive_summary, /the assessed organization/);
assert.match(scrubbed.result.quality_gate.warnings[0], /\[PERSON_NAME_REDACTED\]/);
assert.equal(
  scrubbed.result.phase_1_audit_logs.maturity.A1.evidence_quotes[0].quote,
  result.phase_1_audit_logs.maturity.A1.evidence_quotes[0].quote,
  'raw Phase 1 audit evidence must remain unchanged'
);
assert.ok(findGeneratedReportPrivacyFindings(result).includes('Toni Eskolin'));

assert.match(constantsSource, /fluent anonymized prose/i);
assert.match(constantsSource, /Do not output placeholder tokens such as \[ORGANIZATION_REDACTED\]/);
assert.match(constantsSource, /Focus on what the evidence shows/i);
assert.match(factCheckSource, /placeholder tokens such as \[ORGANIZATION_REDACTED\] are also not acceptable/i);
assert.match(factCheckSource, /Rewrite the sentence fluently with neutral language/i);
assert.match(qualityGateSource, /Write fluent anonymized prose/i);

console.log('privacy service unit tests passed');
