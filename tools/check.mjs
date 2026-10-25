import fs from 'node:fs';
import path from 'node:path';
import { openOffline, frame, assertClean, contentStats, difference, DURATION } from './offline.mjs';

const TIMES = [0.8, 17.2, 34, 45.8, 55, 68, 73.15, 77.35, 82.9, 87.8, 88.8, 103.3, 111.8, 125.4, 130.85, 143.8, 144.01, 153, 169.6, 181, 184.2, 195.3, 205, 214.79, 214.82, 223.91, 230.81, 235.88, 240, 247.8, 252.7];
const args = process.argv.slice(2);
let output = 'output/check-report.json', player = true;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--no-player') player = false;
  else if (args[i] === '--output' && args[i + 1]) output = args[++i];
  else if (args[i] === '--help') {
    console.log('node tools/check.mjs [--output output/check-report.json] [--no-player]\nChecks local assets, keyframes, random seeks, a mobile viewport, and silent/local-audio playback.');
    process.exit(0);
  } else throw new Error(`Unknown argument: ${args[i]}`);
}
output = path.resolve(output);
const report = { startedAt: new Date().toISOString(), scope: 'Headless source rendering and player smoke checks; not human visual acceptance.', frames: [], seeks: [] };

// A generated silent PCM WAV tests file selection without shipping a recording.
function silentWav(seconds = DURATION) {
  const rate = 8000, length = Math.ceil(seconds * rate) * 2, data = Buffer.alloc(44 + length);
  data.write('RIFF', 0); data.writeUInt32LE(36 + length, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(length, 40);
  return data;
}

async function playbackChecks(page) {
  await page.waitForFunction(() => !document.querySelector('#play')?.disabled, null, { timeout: 30000 });
  const initial = await page.evaluate(() => window.demo.stats().time);
  await page.locator('#play').click();
  await page.waitForFunction(t => window.demo.stats().time > t + 0.15, initial, { timeout: 15000 });
  await page.locator('#play').click();
  const paused = await page.evaluate(() => ({ time: window.demo.stats().time, playing: window.demo.playing }));
  if (paused.playing) throw new Error('Pause did not stop silent playback.');
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => window.demo.stats().time);
  if (Math.abs(after - paused.time) > 0.04) throw new Error('Silent playback clock advanced while paused.');
  await page.locator('#seek').evaluate(element => {
    element.value = '77.35'; element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => Math.abs(window.demo.stats().time - 77.35) < 0.05, null, { timeout: 15000 });
  const seek = await page.evaluate(() => ({ time: window.demo.stats().time, clock: document.querySelector('#clock')?.textContent }));
  const input = page.locator('input[type=file]');
  if (await input.count() !== 1) throw new Error('Expected one local-audio file input.');
  await page.locator('#seek').evaluate(element => {
    element.value = '0'; element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await input.setInputFiles({ name: 'qa-silence.wav', mimeType: 'audio/wav', buffer: silentWav() });
  await page.waitForFunction(() => !document.querySelector('#play')?.disabled, null, { timeout: 30000 });
  await page.locator('#play').click();
  await page.waitForFunction(() => window.demo.stats().time > 0.15, null, { timeout: 15000 });
  await page.locator('#play').click();
  const audio = await page.evaluate(() => ({ time: window.demo.stats().time, playing: window.demo.playing, state: window.player?.state?.() }));
  if (audio.playing) throw new Error('Pause did not stop audio playback.');
  if (audio.state?.mode !== 'audio' || Math.abs(audio.state.audioTime - audio.time) > 0.05) throw new Error('Local-audio playback does not follow the audio clock.');
  await page.locator('#seek').evaluate(element => {
    element.value = '100'; element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => Math.abs(window.demo.stats().time - 100) < 0.05, null, { timeout: 15000 });
  const audioSeek = await page.evaluate(() => window.player.state());
  if (Math.abs(audioSeek.audioTime - 100) > 0.05) throw new Error('Seeking the picture did not seek the local audio.');
  await page.locator('#play').click();
  await page.waitForFunction(() => window.demo.stats().time > 100.15, null, { timeout: 15000 });
  await page.locator('#play').click();
  const resumed = await page.evaluate(() => ({ time: window.demo.stats().time, state: window.player.state() }));
  if (Math.abs(resumed.state.audioTime - resumed.time) > 0.05) throw new Error('Audio and picture clocks differ after a seek.');
  return { silent: { initial, paused: paused.time, after }, seek, localAudio: audio, audioSeek, resumed };
}

let session;
try {
  session = await openOffline({ width: 640, height: 360, report });
  const baseline = new Map();
  for (const time of TIMES) {
    const result = await frame(session.page, time);
    const bytes = Buffer.from(result.rgba, 'base64');
    const content = contentStats(bytes);
    if (!content.nonempty) throw new Error(`Blank or nearly uniform frame at ${time}.`);
    if (Math.abs(result.stats.time - time) > 1e-6) throw new Error(`Renderer time mismatch at ${time}.`);
    baseline.set(time, bytes); report.frames.push({ time, scene: result.stats.scene, content });
  }
  // Fixed permutation is reproducible and crosses scene boundaries in both directions.
  const order = TIMES.map((_, i) => TIMES[(i * 13 + 7) % TIMES.length]);
  for (const time of order) {
    const result = await frame(session.page, time);
    const delta = difference(baseline.get(time), Buffer.from(result.rgba, 'base64'));
    report.seeks.push({ time, ...delta });
    if (delta.max > 3 || delta.mean > 0.001) throw new Error(`Non-deterministic seek at ${time}: ${JSON.stringify(delta)}`);
  }
  const boundaries = [];
  for (const [input, expected] of [[-5, 0], [DURATION + 5, DURATION]]) {
    const result = await frame(session.page, input);
    if (Math.abs(result.stats.time - expected) > 1e-6) throw new Error(`Time clamping failed for ${input}.`);
    boundaries.push({ input, actual: result.stats.time });
  }
  report.boundaries = boundaries;
  assertClean(report);
  await session.close(); session = null;
  if (player) {
    session = await openOffline({ width: 390, height: 844, player: true, report });
    report.mobile = await session.page.evaluate(() => {
      const screen = document.querySelector('#screen').getBoundingClientRect();
      return {
        viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        screen: { width: screen.width, height: screen.height, x: screen.x, right: screen.right },
        play: document.querySelector('#play').getBoundingClientRect().toJSON(),
      };
    });
    if (report.mobile.scrollWidth > 391 || report.mobile.screen.right > 391 || report.mobile.screen.x < 0) throw new Error('Mobile layout overflows the viewport.');
    if (Math.abs(report.mobile.screen.width / report.mobile.screen.height - 16 / 9) > 0.02) throw new Error('Mobile film aspect ratio is incorrect.');
    report.playback = await playbackChecks(session.page);
    assertClean(report);
  }
  report.ok = true;
} catch (error) {
  report.ok = false; report.error = error.stack || String(error); process.exitCode = 1;
} finally {
  await session?.close();
  report.finishedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ok: report.ok, report: output, frames: report.frames.length, seeks: report.seeks.length, mobile: report.mobile, error: report.error }, null, 2));
}
