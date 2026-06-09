import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/models.ts', import.meta.url), 'utf8');
const { STAGE_MODELS, modelsFor } = await import('../src/models.ts');

assert.equal(source.includes('gemini'), false, 'Gemini must not be present in the active model registry');
assert.equal(source.includes('haiku'), false, 'Haiku must not be present in the active model registry');

for (const stage of Object.keys(STAGE_MODELS)) {
  const chain = modelsFor(stage);
  assert.ok(chain.length >= 2, `${stage} should have at least one fallback`);
  assert.equal(chain.some((profile) => profile.provider === 'gemini'), false, `${stage} should not use Gemini`);
  assert.equal(chain.some((profile) => /gemini/i.test(profile.id)), false, `${stage} should not reference Gemini IDs`);
  assert.equal(chain.some((profile) => /haiku/i.test(profile.id)), false, `${stage} should not reference Haiku IDs`);
}

assert.equal(STAGE_MODELS.preflight.provider, 'openai');
assert.equal(STAGE_MODELS.preflight.id, 'gpt-5.5');
assert.deepEqual(STAGE_MODELS.preflight.openaiReasoning, { effort: 'low' });

assert.equal(STAGE_MODELS.forensic_audit.provider, 'anthropic');
assert.equal(STAGE_MODELS.forensic_audit.id, 'claude-sonnet-4-6');
assert.equal(modelsFor('forensic_audit')[1].id, 'gpt-5.5');
assert.equal(modelsFor('forensic_audit')[2].id, 'claude-opus-4-7');

assert.equal(STAGE_MODELS.targeted_rescan.provider, 'anthropic');
assert.equal(STAGE_MODELS.targeted_rescan.id, 'claude-opus-4-7');
assert.equal(modelsFor('targeted_rescan')[1].id, 'gpt-5.5');
assert.equal(modelsFor('targeted_rescan')[2].id, 'claude-sonnet-4-6');

assert.equal(STAGE_MODELS.evidence_check.provider, 'openai');
assert.equal(STAGE_MODELS.evidence_check.id, 'gpt-5.5');
assert.equal(modelsFor('evidence_check')[1].id, 'claude-sonnet-4-6');

assert.equal(STAGE_MODELS.evidence_adjudication.provider, 'openai');
assert.equal(modelsFor('evidence_adjudication')[1].id, 'claude-opus-4-7');

assert.equal(STAGE_MODELS.synthesis.provider, 'anthropic');
assert.equal(STAGE_MODELS.synthesis.id, 'claude-sonnet-4-6');
assert.equal(modelsFor('synthesis')[1].id, 'gpt-5.5');

assert.equal(STAGE_MODELS.synthesis_escalation.id, 'claude-opus-4-7');
assert.equal(modelsFor('synthesis_escalation')[1].id, 'gpt-5.5');
assert.deepEqual(modelsFor('synthesis_escalation')[1].openaiReasoning, { effort: 'high' });

assert.equal(STAGE_MODELS.roadmap_synthesis.id, 'claude-opus-4-7');
assert.equal(modelsFor('roadmap_synthesis')[1].id, 'gpt-5.5');
assert.equal(modelsFor('roadmap_synthesis')[2].id, 'claude-sonnet-4-6');

assert.equal(STAGE_MODELS.fact_check.provider, 'openai');
assert.equal(STAGE_MODELS.fact_check.id, 'gpt-5.5');
assert.deepEqual(STAGE_MODELS.fact_check.openaiReasoning, { effort: 'medium' });
assert.equal(STAGE_MODELS.fact_check_high.provider, 'openai');
assert.deepEqual(STAGE_MODELS.fact_check_high.openaiReasoning, { effort: 'high' });
assert.equal(STAGE_MODELS.quality_gate.provider, 'openai');

const routerSource = await readFile(new URL('../src/services/modelRouter.ts', import.meta.url), 'utf8');
assert.equal(routerSource.includes('/api/generate'), false, 'router must not call the Gemini proxy');
assert.equal(routerSource.includes('callGemini'), false, 'router must not include Gemini dispatch code');

const analysisSource = await readFile(new URL('../src/services/analysisService.ts', import.meta.url), 'utf8');
assert.match(
  analysisSource,
  /substage: 'evidence_summary'[\s\S]*?actuals\.synthesis = resp\.modelUsed\.id|actuals\.synthesis = resp\.modelUsed\.id[\s\S]*?substage: 'evidence_summary'/,
  'evidence summary model should be recorded as synthesis metadata'
);
assert.match(
  analysisSource,
  /runStage\('roadmap_synthesis'[\s\S]*?actuals\.roadmap_synthesis = resp\.modelUsed\.id/,
  'roadmap model should be recorded as roadmap_synthesis metadata'
);
assert.match(
  analysisSource,
  /runFactCheck\(strategyData, factCheck\.attempts \+ 1, 'fact_check_high'\)/,
  'fact-check should have a high-reasoning escalation path'
);

const orchestratorSource = await readFile(new URL('../src/orchestrator.ts', import.meta.url), 'utf8');
assert.match(
  orchestratorSource,
  /runTargetedRescan\(batchId, packetInput\.text \|\| text,[\s\S]*rescanItems\)/,
  'targeted rescans should use the dedicated targeted_rescan stage with packet input'
);
assert.match(orchestratorSource, /sourcePackets\?: Phase1SourcePackets/);
assert.match(orchestratorSource, /packetInput\.usedFallback \? undefined : sourcePackets\?\.fullText/);

console.log('model routing unit tests passed');
