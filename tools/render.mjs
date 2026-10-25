import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openOffline, frame, assertClean, contentStats, difference, DURATION } from './offline.mjs';

const HELP = `Render the original Apollo film from its source, without a pre-rendered video.

  node tools/render.mjs --still --time 77.35 --output output/preview.png
  node tools/render.mjs --start 76 --duration 2 --fps 30 --width 1280 --height 720 --output output/sample.mp4
  node tools/render.mjs --output output/full.mp4 --audio /path/to/your/music.wav

Defaults: start 0, remaining film duration, 1920 x 1080, 60 fps, silent.
Options: --still --time N --start N --duration N --fps N --width N --height N
         --output PATH --audio PATH --overwrite --help
Environment: CHROME_PATH, PLAYWRIGHT_MODULE_PATH, FFMPEG_PATH.
The optional audio starts at the same film time as --start. Short audio is padded
with silence. No audio is downloaded. Outputs and reports are not overwritten
unless --overwrite is present. Full export is 15164 frames and can take hours.`;

function sameExistingFile(left, right) {
  let rightReal;
  try { rightReal = fs.realpathSync(right); }
  catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
  const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
  if (normalize(fs.realpathSync(left)) === normalize(rightReal)) return true;
  // Distinct paths can also be hard links to the same file. BigInt avoids loss
  // of precision in large filesystem identifiers.
  const a = fs.statSync(left, { bigint: true }), b = fs.statSync(right, { bigint: true });
  return a.ino !== 0n && b.ino !== 0n && a.dev === b.dev && a.ino === b.ino;
}

function options(args) {
  const out = { width: 1920, height: 1080, fps: 60, start: 0, time: 0 };
  const flags = new Set(['still', 'overwrite', 'help']);
  const values = new Set(['width', 'height', 'fps', 'start', 'time', 'duration', 'output', 'audio']);
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    if (!args[i].startsWith('--')) throw new Error(`Unexpected argument: ${args[i]}`);
    if (flags.has(key)) { out[key] = true; continue; }
    if (!values.has(key) || i + 1 === args.length || args[i + 1].startsWith('--')) throw new Error(`Unknown or incomplete option: --${key}`);
    out[key] = args[++i];
  }
  if (out.help) return out;
  for (const key of ['width', 'height', 'fps', 'start', 'time', 'duration']) {
    if (out[key] !== undefined) {
      out[key] = Number(out[key]);
      if (!Number.isFinite(out[key])) throw new Error(`--${key} must be a finite number.`);
    }
  }
  for (const key of ['width', 'height']) {
    if (!Number.isInteger(out[key]) || out[key] < 2 || out[key] > 7680 || out[key] % 2) throw new Error(`--${key} must be an even integer between 2 and 7680.`);
  }
  if (!Number.isInteger(out.fps) || out.fps < 1 || out.fps > 120) throw new Error('--fps must be an integer between 1 and 120.');
  if (out.start < 0 || out.start >= DURATION || out.time < 0 || out.time > DURATION) throw new Error(`Times must be inside the film (0–${DURATION} seconds).`);
  out.duration ??= DURATION - out.start;
  if (out.duration <= 0 || out.start + out.duration > DURATION + 1e-8) throw new Error('Requested segment extends beyond the film.');
  out.output = path.resolve(out.output ?? (out.still ? 'output/preview.png' : 'output/apollo-go.mp4'));
  if (path.extname(out.output).toLowerCase() !== (out.still ? '.png' : '.mp4')) throw new Error(`Output must use ${out.still ? '.png' : '.mp4'} extension.`);
  if (out.still && out.audio) throw new Error('--audio is only valid for video export.');
  if (out.audio) {
    out.audio = path.resolve(out.audio);
    if (!fs.statSync(out.audio).isFile()) throw new Error('--audio must name a local file.');
    if (sameExistingFile(out.audio, out.output)) throw new Error('Audio input and output must be different files.');
  }
  return out;
}

const jobs = new Set();
let interrupted = false;
function ffmpeg(args, input = false, binary = false) {
  const child = spawn(process.env.FFMPEG_PATH || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], {
    windowsHide: true, stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'],
  });
  jobs.add(child);
  let stderr = '', failure, length = 0;
  const output = [];
  const done = new Promise((resolve, reject) => {
    const fail = error => { failure = error; reject(error); };
    child.on('error', fail);
    child.stdin?.on('error', fail);
    child.stdout.on('data', bytes => {
      length += bytes.length;
      if (length > 256 * 1024 * 1024) { child.kill(); fail(new Error('FFmpeg verification output exceeded 256 MiB.')); }
      else output.push(bytes);
    });
    child.stderr.on('data', bytes => { stderr = (stderr + bytes).slice(-16000); });
    child.on('close', code => {
      jobs.delete(child);
      if (!failure && code === 0) resolve({ output: binary ? Buffer.concat(output) : Buffer.concat(output).toString('utf8'), stderr });
      else fail(failure ?? new Error(`FFmpeg exited ${code}: ${stderr}`));
    });
  });
  done.catch(() => {});
  return { child, done, async write(bytes) {
    if (failure) throw failure;
    if (interrupted || child.exitCode !== null || child.stdin.destroyed) throw new Error('Export interrupted or encoder stopped.');
    if (child.stdin.write(bytes)) return;
    await new Promise((resolve, reject) => {
      const clean = () => { child.stdin.off('drain', drain); child.stdin.off('error', fail); child.off('close', close); };
      const drain = () => { clean(); resolve(); };
      const fail = error => { clean(); reject(error); };
      const close = () => fail(failure ?? new Error('Encoder closed while waiting for input.'));
      child.stdin.once('drain', drain); child.stdin.once('error', fail); child.once('close', close);
    });
  } };
}

function topDown(bytes, width, height) {
  const result = Buffer.alloc(bytes.length), stride = width * 4;
  for (let y = 0; y < height; y++) bytes.copy(result, y * stride, (height - 1 - y) * stride, (height - y) * stride);
  return result;
}

async function main() {
  const opt = options(process.argv.slice(2));
  if (opt.help) { console.log(HELP); return; }
  const reportPath = `${opt.output}.report.json`;
  for (const file of [opt.output, reportPath]) {
    if (!opt.overwrite && fs.existsSync(file)) throw new Error(`Refusing to overwrite ${file}. Use --overwrite explicitly.`);
  }
  fs.mkdirSync(path.dirname(opt.output), { recursive: true });
  const temporary = opt.output.replace(/\.(png|mp4)$/i, `.partial-${process.pid}.$1`);
  if (fs.existsSync(temporary)) throw new Error(`Temporary file already exists: ${temporary}`);
  const frameCount = opt.still ? 1 : Math.ceil(opt.duration * opt.fps - 1e-9);
  const report = { state: 'starting', startedAt: new Date().toISOString(), options: opt, sourceDuration: DURATION,
    expectedFrames: frameCount, expectedVideoDuration: frameCount / opt.fps, completedFrames: 0,
    frameTransfer: 'WebGL RGBA bottom-up readPixels; FFmpeg vflip produces upright video.',
    audio: opt.audio ? 'Local user-supplied file; offset by segment start; padded only if shorter than video.' : 'Silent; no commercial recording included.',
  };
  const began = Date.now();
  function save(state) {
    report.state = state; report.elapsedSeconds = (Date.now() - began) / 1000;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  let session;
  const interrupt = () => { interrupted = true; for (const job of jobs) job.kill(); void session?.browser.close(); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    if (!opt.still) await ffmpeg(['-version']).done;
    save('loading');
    session = await openOffline({ width: opt.width, height: opt.height, report });
    if (interrupted) throw new Error('Export interrupted.');
    const first = await frame(session.page, opt.still ? opt.time : opt.start, { png: opt.still });
    const source = Buffer.from(first.rgba, 'base64');
    report.firstFrame = { stats: first.stats, content: contentStats(source) };
    if (first.width !== opt.width || first.height !== opt.height) throw new Error('Renderer dimensions do not match export options.');
    if (opt.still) {
      const png = Buffer.from(first.png, 'base64');
      if (png.readUInt32BE(16) !== opt.width || png.readUInt32BE(20) !== opt.height) throw new Error('PNG dimensions are incorrect.');
      fs.writeFileSync(temporary, png, { flag: 'wx' });
      report.completedFrames = 1;
      report.verification = { pngSignature: png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), width: opt.width, height: opt.height };
    } else {
      const encoder = ffmpeg([
        '-n', '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${opt.width}x${opt.height}`, '-framerate', String(opt.fps), '-i', 'pipe:0',
        ...(opt.audio ? ['-ss', String(opt.start), '-i', opt.audio] : []), '-map', '0:v:0',
        ...(opt.audio ? ['-map', '1:a:0', '-c:a', 'aac', '-b:a', '320k', '-af', 'apad'] : ['-an']),
        '-vf', 'vflip,scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
        '-t', String(frameCount / opt.fps), '-frames:v', String(frameCount), '-movflags', '+faststart', temporary,
      ], true);
      save('rendering');
      for (let i = 0; i < frameCount; i++) {
        if (interrupted) throw new Error('Export interrupted.');
        const current = i === 0 ? first : await frame(session.page, opt.start + i / opt.fps);
        const bytes = Buffer.from(current.rgba, 'base64');
        if (bytes.length !== opt.width * opt.height * 4) throw new Error(`Incomplete frame ${i}.`);
        await encoder.write(bytes);
        report.completedFrames = i + 1;
        if ((i + 1) % 60 === 0 || i + 1 === frameCount) {
          assertClean(report); save('rendering');
          console.log(`Rendered ${i + 1}/${frameCount} frames (${report.elapsedSeconds.toFixed(1)} s elapsed).`);
        }
      }
      encoder.child.stdin.end();
      await encoder.done;
      save('verifying');
      const decoded = await ffmpeg(['-i', temporary, '-map', '0:v:0', '-f', 'framehash', '-']).done;
      const lines = decoded.output.split(/\r?\n/);
      const actualFrames = lines.filter(line => /^\s*0,/.test(line)).length;
      const dimensions = lines.find(line => line.startsWith('#dimensions 0:'))?.split(':')[1].trim();
      const timebase = lines.find(line => line.startsWith('#tb 0:'))?.split(':')[1].trim();
      if (actualFrames !== frameCount || dimensions !== `${opt.width}x${opt.height}`) throw new Error(`Decoded video mismatch: ${actualFrames} frames; ${dimensions}.`);
      const image = await ffmpeg(['-i', temporary, '-map', '0:v:0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], false, true).done;
      const upright = difference(topDown(source, opt.width, opt.height), image.output);
      const upsideDown = difference(source, image.output);
      if (upright.mean > 12 || upright.mean > upsideDown.mean + 0.05) throw new Error(`Encoded frame differs from upright source: ${JSON.stringify({ upright, upsideDown })}`);
      if (opt.audio) await ffmpeg(['-i', temporary, '-map', '0:a:0', '-f', 'null', '-']).done;
      report.verification = { decodedAllFrames: true, actualFrames, dimensions, timebase, orientation: { uprightMean: upright.mean, upsideDownMean: upsideDown.mean }, audioDecoded: Boolean(opt.audio) };
    }
    assertClean(report);
    if (interrupted) throw new Error('Export interrupted.');
    // Recheck before committing: do not overwrite a file created during a long render.
    if (!opt.overwrite && fs.existsSync(opt.output)) throw new Error(`Output appeared during rendering: ${opt.output}`);
    fs.renameSync(temporary, opt.output);
    report.bytes = fs.statSync(opt.output).size; report.finishedAt = new Date().toISOString(); save('complete');
    console.log(JSON.stringify({ output: opt.output, report: reportPath, frames: report.completedFrames, verification: report.verification }, null, 2));
  } catch (error) {
    report.error = error.stack || String(error); report.partialFile = fs.existsSync(temporary) ? temporary : null;
    save(interrupted ? 'interrupted' : 'failed'); throw error;
  } finally {
    for (const job of jobs) job.kill();
    await session?.close();
    process.off('SIGINT', interrupt); process.off('SIGTERM', interrupt);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
