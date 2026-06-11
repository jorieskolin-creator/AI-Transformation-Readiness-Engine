import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const titles = {
  A: 'Adaptive Operating Model',
  B: 'Enterprise AI Architecture & Platform Readiness',
  C: 'AI Strategy, Governance & Value Realization',
  D: 'Data Foundations, Ownership & Accessibility',
  E: 'Business Capability & Service Architecture',
};

const compileService = async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aiTransformation-source-registry-'));
  let source = await readFile(new URL('../src/services/sourceRegistryService.ts', import.meta.url), 'utf8');
  source = source.replace(
    "import { BATCH_TITLES } from '../knowledge_base';",
    `const BATCH_TITLES = ${JSON.stringify(titles)};`
  );
  source = source.replace(/import type \{[\s\S]*?\} from '\.\.\/types';\n/, '');
  const modulePath = join(dir, 'sourceRegistryService.ts');
  await writeFile(modulePath, source, 'utf8');
  return import(`file://${modulePath}`);
};

const {
  buildSourceRegistry,
  buildDomainPackets,
  scanRegistryDlp,
  buildDlpReviewPacket,
  sourceRegistryRuntimeStatus,
} = await compileService();

const sourceText = `
<DOCUMENT name="operating-model.pdf">
[PDF_PAGE source="operating-model.pdf" page="1"]
The service area has an operating rhythm, decision rights, demand routing, launch-and-learn pilot learning loops, human-in-the-loop escalation, and community practices.
[/PDF_PAGE]
[PDF_PAGE source="operating-model.pdf" page="2"]
The AI platform uses API integration, service boundary patterns, model gateway routing, observability, evaluation, guardrails, cache controls, quotas, and platform-as-product ownership.
[/PDF_PAGE]
</DOCUMENT>
<DOCUMENT name="value-data-service.pdf">
[PDF_PAGE source="value-data-service.pdf" page="3"]
AI strategy uses impact statements, value hypotheses, responsible AI governance, portfolio investment decisions, budget guardrails, unit economics, and cost per outcome.
[/PDF_PAGE]
[PDF_PAGE source="value-data-service.pdf" page="4"]
Data ownership, semantic context, lineage, freshness, access, privacy, retrieval, RAG, embeddings, vector stores, and grounding are mapped to decisions.
[/PDF_PAGE]
[PDF_PAGE source="value-data-service.pdf" page="5"]
Service catalog, capability map, service blueprint, value stream, customer journey, solution traceability, service area team ownership, rollout, and scaling are explicit.
[/PDF_PAGE]
</DOCUMENT>`;

const registry = buildSourceRegistry(sourceText, [{
  mimeType: 'image/png',
  data: 'iVBORw0KGgo=',
  source_name: 'operating-model.pdf',
  page_number: 2,
}]);

assert.equal(registry.source_count, 2);
assert.ok(registry.chunk_count >= 6);
assert.ok(registry.chunks.every((chunk) => /^src-\d{3}/.test(chunk.source_id)));
assert.ok(registry.chunks.some((chunk) => /^src-001-p002-img/.test(chunk.chunk_id)));

const packets = buildDomainPackets(registry);
assert.deepEqual(Object.keys(packets).sort(), ['A', 'B', 'C', 'D', 'E']);
assert.equal(Object.keys(packets).includes('F'), false);
for (const domain of Object.keys(titles)) {
  assert.ok(packets[domain].included_chunk_count >= 1, `${domain} packet should include routed chunks`);
  assert.match(packets[domain].text, new RegExp(`<SOURCE_PACKET domain="${domain}"`));
  assert.match(packets[domain].text, /<CHUNK /);
}

const weakRegistry = buildSourceRegistry('<DOCUMENT name="blank.txt">No relevant transformation language here.</DOCUMENT>', []);
const weakPackets = buildDomainPackets(weakRegistry);
assert.equal(weakPackets.A.weak_coverage, true);
assert.match(weakPackets.A.text, /NO_ROUTED_CHUNKS|weak deterministic coverage/);

const dlpText = `<DOCUMENT name="long.txt">${'ordinary text '.repeat(500)} sk-thisIsASecretKeyThatAppearsAfterTheOldFirst1500CharacterWindow ${'more text '.repeat(500)}</DOCUMENT>`;
const dlpRegistry = buildSourceRegistry(dlpText, []);
const dlp = scanRegistryDlp(dlpRegistry);
assert.equal(dlp.blocked, true);
assert.ok(dlp.high_risk_hits.some((hit) => hit.kind === 'secret'));

const reviewPacket = buildDlpReviewPacket(registry);
assert.ok(reviewPacket.selected_chunk_count >= 2);
assert.match(reviewPacket.text, /DLP_REVIEW_PACKET/);
assert.match(reviewPacket.text, /Full deterministic DLP scanned/);

const manyImages = Array.from({ length: 12 }, (_, idx) => ({
  mimeType: 'image/png',
  data: 'iVBORw0KGgo=',
  source_name: 'operating-model.pdf',
  page_number: idx + 1,
}));
const imageHeavyRegistry = buildSourceRegistry(sourceText, manyImages);
const imageHeavyReviewPacket = buildDlpReviewPacket(imageHeavyRegistry);
assert.equal(imageHeavyReviewPacket.images.length, 10, 'DLP model review should cap visual samples at 10 images');

const status = sourceRegistryRuntimeStatus(registry, packets, reviewPacket.selected_chunk_count, scanRegistryDlp(registry));
assert.equal(status.source_count, registry.source_count);
assert.equal(status.chunk_count, registry.chunk_count);
assert.deepEqual(Object.keys(status.packets).sort(), ['A', 'B', 'C', 'D', 'E']);

console.log('source registry packetizer tests passed');
