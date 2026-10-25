import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startServer } from '../tools/server.mjs';

let fixture, root, server, port;
before(async () => {
  fixture = await mkdtemp(path.join(tmpdir(), 'apollo-server-test-'));
  root = path.join(fixture, 'public');
  await mkdir(path.join(root, 'film', 'apollo-finale'), { recursive: true });
  await mkdir(path.join(root, '.git'));
  await mkdir(path.join(root, 'no-index'));
  await mkdir(path.join(fixture, 'outside'));
  await Promise.all([
    writeFile(path.join(root, 'film', 'apollo-finale', 'index.html'), '<!doctype html><title>Apollo</title>'),
    writeFile(path.join(root, 'code.js'), 'export const test = 1;'),
    writeFile(path.join(root, 'clip.mp4'), Buffer.from('0123456789')),
    writeFile(path.join(root, 'empty.wav'), Buffer.alloc(0)),
    writeFile(path.join(root, '中文.txt'), '月球'),
    writeFile(path.join(root, '.git', 'config'), 'private'),
    writeFile(path.join(root, '.env'), 'secret'),
    writeFile(path.join(fixture, 'outside', 'secret.txt'), 'outside'),
  ]);
  server = await startServer({ root, port: 0 });
  port = server.address().port;
});

after(async () => {
  if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  if (fixture) {
    // Only the mkdtemp fixture, verified to remain under the OS temporary directory.
    const relative = path.relative(path.resolve(tmpdir()), path.resolve(fixture));
    assert.ok(relative.startsWith('apollo-server-test-') && !relative.includes(path.sep));
    await rm(fixture, { recursive: true, force: true });
  }
});

function request(url, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: url, method, headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString('utf8') }));
      response.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

test('binds only loopback; redirects the root and preserves query parameters', async () => {
  assert.equal(server.address().address, '127.0.0.1');
  const result = await request('/?export&time=77.35');
  assert.equal(result.status, 302);
  assert.equal(result.headers.location, '/film/apollo-finale/?export&time=77.35');
});

test('serves index, script MIME, UTF-8 filenames and HEAD without a body', async () => {
  const folder = await request('/film/apollo-finale?export');
  assert.equal(folder.headers.location, '/film/apollo-finale/?export');
  const index = await request('/film/apollo-finale/');
  assert.equal(index.status, 200);
  assert.match(index.body, /<title>Apollo<\/title>/);
  const script = await request('/code.js?cache=1');
  assert.match(script.headers['content-type'], /^text\/javascript/);
  assert.equal(script.headers['x-content-type-options'], 'nosniff');
  const head = await request('/code.js', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(Number(head.headers['content-length']), Buffer.byteLength(script.body));
  assert.equal((await request(`/${encodeURIComponent('中文.txt')}`)).body, '月球');
});

test('serves closed, open-ended, suffix and clamped byte ranges', async () => {
  for (const [range, body, contentRange] of [
    ['bytes=2-5', '2345', 'bytes 2-5/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'],
    ['bytes=8-999', '89', 'bytes 8-9/10'],
    ['bytes=-99', '0123456789', 'bytes 0-9/10'],
  ]) {
    const result = await request('/clip.mp4', { headers: { range } });
    assert.equal(result.status, 206, range);
    assert.equal(result.body, body, range);
    assert.equal(result.headers['content-range'], contentRange);
    assert.equal(Number(result.headers['content-length']), body.length);
    assert.equal(result.headers['content-type'], 'video/mp4');
  }
});

test('rejects unsatisfiable, malformed and multipart ranges; HEAD ignores Range', async () => {
  for (const range of ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4', 'items=0-1', 'bytes=9007199254740992-']) {
    const result = await request('/clip.mp4', { headers: { range } });
    assert.equal(result.status, 416, range);
    assert.equal(result.headers['content-range'], 'bytes */10');
  }
  assert.equal((await request('/empty.wav')).status, 200);
  assert.equal((await request('/empty.wav', { headers: { range: 'bytes=0-' } })).status, 416);
  const head = await request('/clip.mp4', { method: 'HEAD', headers: { range: 'bytes=2-5' } });
  assert.equal(head.status, 200);
  assert.equal(head.headers['content-length'], '10');
  assert.equal(head.body, '');
});

test('rejects traversal, hidden files, malformed encoding and unsupported methods', async () => {
  for (const name of ['/../outside/secret.txt', '/%2e%2e/outside/secret.txt', '/film/../../outside/secret.txt',
    '/.git/config', '/%2egit/config', '/.env', '/film/%2e%2e/code.js', '/..%5coutside/secret.txt',
    '/clip.mp4:extra', '/.git./config', '/.git%20/config', '/%00secret', '//film/apollo-finale', '/%2ffilm/apollo-finale']) {
    assert.equal((await request(name)).status, 403, name);
  }
  assert.equal((await request('/%zz')).status, 400);
  assert.equal((await request('/missing.txt')).status, 404);
  assert.equal((await request('/no-index/')).status, 404);
  const result = await request('/code.js', { method: 'POST' });
  assert.equal(result.status, 405);
  assert.equal(result.headers.allow, 'GET, HEAD');
});

test('rejects links outside the root and aliases into hidden directories', async t => {
  try {
    await symlink(path.join(fixture, 'outside'), path.join(root, 'escape'), 'junction');
    await symlink(path.join(root, '.git'), path.join(root, 'git-alias'), 'junction');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip('This host does not allow temporary directory links.'); return; }
    throw error;
  }
  assert.equal((await request('/escape/secret.txt')).status, 403);
  assert.equal((await request('/git-alias/config')).status, 403);
});
