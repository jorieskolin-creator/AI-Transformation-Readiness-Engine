import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const {
  ANTHROPIC_IMAGE_MAX_LONG_EDGE,
  DEFAULT_IMAGE_MAX_LONG_EDGE,
  constrainImageDimensions,
  normalizeImageInput,
} = await import('../src/services/imageNormalizationService.ts');

assert.equal(DEFAULT_IMAGE_MAX_LONG_EDGE, 1600);
assert.equal(ANTHROPIC_IMAGE_MAX_LONG_EDGE, 1900);

assert.deepEqual(constrainImageDimensions(3200, 1800, 1600), {
  width: 1600,
  height: 900,
  scale: 0.5,
});
assert.deepEqual(constrainImageDimensions(1200, 2400, 1600), {
  width: 800,
  height: 1600,
  scale: 1600 / 2400,
});
assert.deepEqual(constrainImageDimensions(900, 600, 1600), {
  width: 900,
  height: 600,
  scale: 1,
});

const noDomResult = await normalizeImageInput({
  mimeType: 'image/jpeg',
  data: 'abc',
  source_name: 'small.jpg',
  width: 900,
  height: 600,
});
assert.equal(noDomResult.data, 'abc', 'non-browser tests should not mutate undecodable image data');

const routerSource = await readFile(new URL('../src/services/modelRouter.ts', import.meta.url), 'utf8');
assert.match(routerSource, /normalizeImageInputs\(prompt\.images, \{ maxLongEdge: ANTHROPIC_IMAGE_MAX_LONG_EDGE \}\)/);

console.log('image normalization tests passed');
