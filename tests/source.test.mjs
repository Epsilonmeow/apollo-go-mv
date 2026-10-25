import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/original-source-manifest.json')));

test('original render sources and bundled assets retain their release hashes', () => {
  assert.equal(manifest.files.length, 31);
  for (const file of manifest.files) {
    const bytes = fs.readFileSync(path.join(root, file.path));
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
});
test('the complete render dependency graph is local and present', () => {
  const seen = new Set();
  function walk(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
      assert.ok(match[1].startsWith('.'), `Non-local module: ${match[1]}`);
      const dependency = path.resolve(path.dirname(file), match[1]);
      assert.ok(dependency.startsWith(root + path.sep), 'Module leaves the project');
      walk(dependency);
    }
  }
  walk(path.join(root, 'film/apollo-finale/main.js'));
  assert.equal(seen.size, 28);
});
