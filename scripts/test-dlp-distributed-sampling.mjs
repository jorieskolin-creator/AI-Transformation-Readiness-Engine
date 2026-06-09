import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const compileSecurity = async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aiTransformation-security-'));
  let source = await readFile(new URL('../src/services/securityService.ts', import.meta.url), 'utf8');
  source = source.replace("import DOMPurify from 'dompurify';", 'const DOMPurify = { sanitize: (html) => html };');
  source = source.replace(/import \{ ImageInput \} from '\.\.\/types';\n/, '');
  const modulePath = join(dir, 'securityService.ts');
  await writeFile(modulePath, source, 'utf8');
  return import(`file://${modulePath}`);
};

const { generateSafetyAuditPrompt } = await compileSecurity();
const prompt = generateSafetyAuditPrompt('<DLP_REVIEW_PACKET>first middle final</DLP_REVIEW_PACKET>', [
  { mimeType: 'image/png', data: 'abc', source_name: 'source.pdf', page_number: 7 },
]);

assert.match(prompt, /distributed review packet/);
assert.match(prompt, /deterministic scanner has already inspected the full parsed source registry/i);
assert.match(prompt, /representative chunks from the beginning, middle, end/i);
assert.equal(prompt.includes('first 1500 chars'), false);
assert.match(prompt, /1 attached image part/);
assert.match(prompt, /DLP_REVIEW_PACKET/);

console.log('DLP distributed sampling tests passed');
