import http from 'node:http';
import path from 'node:path';
import { realpath, stat, open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
}));

function unsafeSegment(segment) {
  return segment.startsWith('.') || /[.\s]$/.test(segment);
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`)
    && !relative.split(path.sep).some(unsafeSegment);
}

function reply(request, response, status, text, headers = {}) {
  const body = `${text}\n`;
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

function byteRange(value, length) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || length === 0) return null;
  const first = match[1] ? Number(match[1]) : undefined;
  const last = match[2] ? Number(match[2]) : undefined;
  if ((first !== undefined && !Number.isSafeInteger(first)) || (last !== undefined && !Number.isSafeInteger(last))) return null;
  if (first === undefined) return last > 0 ? { start: Math.max(0, length - last), end: length - 1 } : null;
  if (first >= length || (last !== undefined && last < first)) return null;
  return { start: first, end: Math.min(last ?? length - 1, length - 1) };
}

/** Serve one explicit directory on loopback. No dependencies or public binding. */
export async function startServer({ root = PROJECT_ROOT, port = 0 } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer from 0 to 65535.');
  const rootPath = await realpath(path.resolve(root));
  if (!(await stat(rootPath)).isDirectory()) throw new Error('Server root must be a directory.');
  const server = http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Referrer-Policy', 'no-referrer');
    if (!['GET', 'HEAD'].includes(request.method)) {
      reply(request, response, 405, 'Method not allowed.', { Allow: 'GET, HEAD' });
      return;
    }
    let file;
    try {
      // Inspect before URL normalization so /../ and encoded equivalents cannot disappear.
      const raw = request.url ?? '/';
      const queryAt = raw.indexOf('?');
      const rawPath = queryAt < 0 ? raw : raw.slice(0, queryAt);
      const query = queryAt < 0 ? '' : raw.slice(queryAt);
      let pathname;
      try { pathname = decodeURIComponent(rawPath); }
      catch { reply(request, response, 400, 'Malformed URL encoding.'); return; }
      if (!pathname.startsWith('/') || pathname.startsWith('//') || /[\\:\x00-\x1f\x7f]/.test(pathname)
        || pathname.split('/').some(unsafeSegment)) {
        reply(request, response, 403, 'Path not allowed.'); return;
      }
      if (pathname === '/') {
        reply(request, response, 302, 'Open the film player.', { Location: `/film/apollo-finale/${query}` });
        return;
      }
      let candidate = path.resolve(rootPath, `.${pathname}`);
      if (!inside(rootPath, candidate)) { reply(request, response, 403, 'Path not allowed.'); return; }
      candidate = await realpath(candidate);
      if (!inside(rootPath, candidate)) { reply(request, response, 403, 'Path not allowed.'); return; }
      const metadata = await stat(candidate);
      if (metadata.isDirectory()) {
        if (!pathname.endsWith('/')) {
          reply(request, response, 302, 'Directory index.', { Location: `${rawPath}/${query}` }); return;
        }
        candidate = await realpath(path.join(candidate, 'index.html'));
        if (!inside(rootPath, candidate)) { reply(request, response, 403, 'Path not allowed.'); return; }
      }
      file = await open(candidate, 'r');
      const info = await file.stat();
      if (!info.isFile()) { await file.close(); file = undefined; reply(request, response, 403, 'Not a regular file.'); return; }
      const headers = {
        'Content-Type': MIME.get(path.extname(candidate).toLowerCase()) ?? 'application/octet-stream',
        'Accept-Ranges': 'bytes', 'Content-Length': info.size,
        'Last-Modified': info.mtime.toUTCString(),
      };
      // HTTP Range only applies to GET; HEAD reports the full representation.
      let range;
      if (request.method === 'GET' && request.headers.range !== undefined) {
        range = byteRange(request.headers.range, info.size);
        if (!range) {
          await file.close(); file = undefined;
          reply(request, response, 416, 'Range not satisfiable.', { 'Content-Range': `bytes */${info.size}`, 'Accept-Ranges': 'bytes' });
          return;
        }
        headers['Content-Length'] = range.end - range.start + 1;
        headers['Content-Range'] = `bytes ${range.start}-${range.end}/${info.size}`;
      }
      response.writeHead(range ? 206 : 200, headers);
      if (request.method === 'HEAD' || info.size === 0) {
        await file.close(); file = undefined; response.end(); return;
      }
      const stream = file.createReadStream({ ...(range ?? {}), autoClose: true });
      file = undefined;
      response.once('close', () => stream.destroy());
      stream.once('error', () => response.destroy());
      stream.pipe(response);
    } catch (error) {
      await file?.close().catch(() => {});
      if (response.headersSent) { response.destroy(); return; }
      const status = ['ENOENT', 'ENOTDIR'].includes(error.code) ? 404
        : ['EACCES', 'EPERM'].includes(error.code) ? 403 : 500;
      reply(request, response, status, status === 404 ? 'Not found.' : status === 403 ? 'Path not allowed.' : 'Could not read file.');
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { server.off('error', reject); resolve(); });
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let root = PROJECT_ROOT, port = 5199;
  try {
    for (let i = 2; i < process.argv.length; i++) {
      const flag = process.argv[i], value = process.argv[++i];
      if (flag === '--port' && value !== undefined && /^\d+$/.test(value)) port = Number(value);
      else if (flag === '--root' && value) root = path.resolve(value);
      else throw new Error('Usage: node tools/server.mjs [--port 5199] [--root PATH]');
    }
    const server = await startServer({ root, port });
    console.log(`Apollo player: http://127.0.0.1:${server.address().port}/`);
    const stop = () => { server.close(); server.closeAllConnections(); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
