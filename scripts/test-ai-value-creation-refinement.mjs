import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const readText = async (path) => readFile(new URL(path, import.meta.url), 'utf8');

const criteria = await readJson('../src/knowledge_base/aiTransformation_criteria.json');
const antipatterns = await readJson('../src/knowledge_base/aiTransformation_antipatterns.json');
const tactics = await readJson('../src/knowledge_base/aiTransformation_tactics_database.json');
const playbook = await readJson('../src/knowledge_base/aiTransformation_tactic_activity_playbook.json');
const constants = await readText('../src/constants.ts');
const fixture = await readText('../test/ai-value-creation-refinement-snippets.txt');

const maturityIds = criteria.criteria.map(c => c.id);
const antipatternIds = antipatterns.criteria.map(c => `AP-${c.id}`);

assert.deepEqual(maturityIds, [
  'A1', 'A2', 'A3', 'A4', 'A5',
  'B1', 'B2', 'B3', 'B4', 'B5',
  'C1', 'C2', 'C3', 'C4', 'C5',
  'D1', 'D2', 'D3', 'D4', 'D5',
  'E1', 'E2', 'E3', 'E4', 'E5'
], 'maturity criterion IDs must remain stable');

assert.deepEqual(antipatternIds, [
  'AP-A1', 'AP-A2', 'AP-A3', 'AP-A4', 'AP-A5',
  'AP-B1', 'AP-B2', 'AP-B3', 'AP-B4', 'AP-B5',
  'AP-C1', 'AP-C2', 'AP-C3', 'AP-C4', 'AP-C5',
  'AP-D1', 'AP-D2', 'AP-D3', 'AP-D4', 'AP-D5',
  'AP-E1', 'AP-E2', 'AP-E3', 'AP-E4', 'AP-E5'
], 'anti-pattern criterion IDs must remain stable');

const corpus = [
  JSON.stringify(criteria),
  JSON.stringify(antipatterns),
  JSON.stringify(tactics),
  JSON.stringify(playbook),
  constants,
  fixture,
].join('\n').toLowerCase();

for (const phrase of [
  'kickstart',
  'building-the-system',
  'impact statement',
  'evidence-based business case',
  'service-area ownership',
  'data as fuel',
  'semantic context',
  'secure-by-design',
  'agent behavioral contract',
  'human-in-the-loop',
  'sense & respond',
  'brownfield',
  'platform-as-product',
  'service blueprint',
]) {
  assert.ok(corpus.includes(phrase), `refinement corpus should include ${phrase}`);
}

assert.ok(constants.includes('AI_DOMAIN_AXIOMS'), 'domain axioms must be injected into prompts');
assert.ok(constants.includes('Tool adoption, platform build-out, strategy slogans, and pilots are not readiness evidence by themselves.'), 'tool adoption axiom must be explicit');
assert.ok(constants.includes('Predictable AI work and uncertain AI value creation must be routed differently'), 'dual-path routing axiom must be explicit');
assert.ok(constants.includes('internal sparring material only'), 'Reference KB must be framed as internal sparring material');
assert.ok(constants.includes('Do not cite, quote, name, summarize, or disclose'), 'Reference KB confidentiality must be explicit in prompts');
assert.ok(constants.includes('Convert any Knowledge Base influence into generic methodology language'), 'Reference KB influence must be genericized');
assert.ok(fixture.includes('This snippet should not prove AI readiness.'), 'synthetic fixture must lock tool adoption without readiness');
assert.ok(fixture.includes('pilot AI playbook'), 'synthetic fixture must include Kickstart-to-Building proof');

const tacticIds = new Set(tactics.tactics.map(t => t.id));
for (const entry of playbook.entries) {
  assert.ok(tacticIds.has(entry.tactic_id), `${entry.tactic_id} must exist in tactics DB`);
}

console.log('AI value creation refinement tests passed');
