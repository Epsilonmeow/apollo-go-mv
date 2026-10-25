import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startServer } from './server.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DURATION = 252.720544217687;
const require = createRequire(import.meta.url);

// A private headless Chromium instance; never attaches to a user's browser.
export async function openOffline({ width = 1280, height = 720, player = false, report = {} } = {}) {
  const playwright = process.env.PLAYWRIGHT_MODULE_PATH
    ? require(path.resolve(process.env.PLAYWRIGHT_MODULE_PATH))
    : await import('playwright');
  const server = await startServer({ port: 0, root: ROOT });
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const close = async () => {
    await browser?.close().catch(() => {});
    await new Promise(resolve => server.close(resolve));
  };
  report.errors ??= [];
  report.blockedRequests ??= [];
  report.failedRequests ??= [];
  report.network = 'Only this process\'s local HTTP server is allowed. External browser requests are blocked.';
  try {
    browser = await playwright.chromium.launch({
      headless: true,
      ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
      args: [
        '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
        '--no-first-run', '--enable-webgl', '--ignore-gpu-blocklist', '--force-color-profile=srgb',
        '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      ],
    });
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    await context.route('**/*', async route => {
      const url = route.request().url();
      if (new URL(url).origin === origin) return route.continue();
      report.blockedRequests.push(url);
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('response', response => {
      if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() });
    });
    await page.goto(`${origin}/film/apollo-finale/${player ? '' : '?export'}`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.demo?.ready === true, null, { timeout: 120000 });
    await page.waitForFunction(() => !window.player || window.player.state().ready, null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    if (!player) await page.evaluate(({ width, height }) => window.demo.setSize(width, height), { width, height });
    assertClean(report);
    return { page, context, browser, server, origin, close };
  } catch (error) {
    await close();
    throw error;
  }
}

export function assertClean(report) {
  if (report.errors?.length || report.blockedRequests?.length || report.failedRequests?.length) {
    throw new Error(`Browser checks failed: ${JSON.stringify({ errors: report.errors, blockedRequests: report.blockedRequests, failedRequests: report.failedRequests })}`);
  }
}

// WebGL readback has a bottom-left origin. PNG via toDataURL has a top-left origin.
export async function frame(page, time, { png = false } = {}) {
  return page.evaluate(({ time, png }) => {
    window.demo.render(time);
    const canvas = document.querySelector('#stage');
    const gl = canvas.getContext('webgl2');
    if (!gl || gl.isContextLost()) throw new Error('WebGL2 is unavailable or its context was lost.');
    const bytes = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    const error = gl.getError();
    if (error !== gl.NO_ERROR) throw new Error(`WebGL readPixels failed: ${error}`);
    let rgba;
    if (typeof bytes.toBase64 === 'function') rgba = bytes.toBase64();
    else {
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 32768) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
      }
      rgba = btoa(binary);
    }
    return {
      rgba, width: canvas.width, height: canvas.height, stats: window.demo.stats(),
      ...(png ? { png: canvas.toDataURL('image/png').split(',')[1] } : {}),
    };
  }, { time, png });
}

export function difference(a, b) {
  if (a.length !== b.length) throw new Error('Frame byte lengths differ.');
  let total = 0, max = 0, changed = 0;
  for (let i = 0; i < a.length; i++) {
    const delta = Math.abs(a[i] - b[i]);
    total += delta;
    if (delta) changed++;
    max = Math.max(max, delta);
  }
  return { max, mean: total / a.length, changed };
}

export function contentStats(bytes) {
  let min = 255, max = 0, bright = 0;
  for (let i = 0; i < bytes.length; i += 4) {
    const value = Math.max(bytes[i], bytes[i + 1], bytes[i + 2]);
    min = Math.min(min, value); max = Math.max(max, value);
    if (value > 48) bright++;
  }
  return { min, max, brightFraction: bright / (bytes.length / 4), nonempty: max - min > 30 && bright > 16 };
}
