import { DURATION } from './timing.js';
const EXPORT = new URLSearchParams(location.search).has('export');
const ui = Object.fromEntries(['screen','loading','play','reset','jump','mute','seek','clock','status','soundtrack','silent'].map(id => [id, document.getElementById(id)]));
const audio = new Audio();
audio.preload = 'auto';
let demo, ready = false, playing = false, pendingPlay = false, loadingAudio = false;
let time = 0, anchor = 0, raf = 0, mode = 'silent', playGeneration = 0, sourceGeneration = 0, objectURL;
let scrubbing = false, resumeAfterScrub = false, cancelLoad;
const clamp = value => Math.max(0, Math.min(DURATION, Number(value) || 0));
const current = () => playing ? (mode === 'audio' ? audio.currentTime : (performance.now() - anchor) / 1000) : time;

function controls() {
  ui.play.textContent = playing ? '暂停' : time >= DURATION ? '再播放' : '播放';
  ui.play.disabled = !ready || loadingAudio || pendingPlay;
  ui.seek.disabled = !ready || loadingAudio;
  ui.seek.value = String(time);
  ui.seek.setAttribute('aria-valuetext', `${time.toFixed(2)} / ${DURATION.toFixed(2)} 秒`);
  ui.clock.textContent = `${time.toFixed(2)} / ${DURATION.toFixed(2)}`;
  ui.mute.disabled = !ready || mode !== 'audio';
}
function render(value) { time = clamp(value); demo.render(time); controls(); }
function pause() {
  const last = current();
  ++playGeneration; pendingPlay = false;
  cancelAnimationFrame(raf); audio.pause();
  playing = false;
  if (demo) demo.playing = false;
  if (ready) render(last);
  controls();
}
function seek(value) {
  if (!ready || loadingAudio) return;
  const next = clamp(value);
  if (next >= DURATION) pause();
  if (mode === 'audio') audio.currentTime = Math.min(next, audio.duration || next);
  anchor = performance.now() - next * 1000;
  render(next);
}
function tick() {
  if (!playing) return;
  const next = current();
  if (next >= DURATION) { pause(); render(DURATION); return; }
  render(next); raf = requestAnimationFrame(tick);
}
async function play() {
  if (!ready || EXPORT || loadingAudio || playing || pendingPlay) return;
  if (time >= DURATION - 1e-5 || (mode === 'audio' && time >= audio.duration)) seek(0);
  const generation = ++playGeneration;
  pendingPlay = true; controls();
  try {
    if (mode === 'audio') { audio.currentTime = time; await audio.play(); }
    if (generation !== playGeneration) return;
    anchor = performance.now() - time * 1000;
    playing = true; demo.playing = true; tick();
  } catch (error) {
    if (generation === playGeneration) {
      ui.status.textContent = error.name === 'NotAllowedError' ? '请再按一次播放，允许浏览器播放声音。' : '音频无法播放，请选择浏览器支持的文件，或切换无声预览。';
      playing = false; demo.playing = false;
    }
  } finally {
    if (generation === playGeneration) { pendingPlay = false; controls(); }
  }
}
function clearAudio() {
  ++sourceGeneration; cancelLoad?.(); cancelLoad = undefined;
  audio.removeAttribute('src'); audio.load();
  if (objectURL) URL.revokeObjectURL(objectURL);
  objectURL = undefined; mode = 'silent'; loadingAudio = false;
}
function useSilent() {
  pause(); clearAudio(); ui.soundtrack.value = '';
  ui.status.textContent = '无声预览 / Silent preview · 可选择本地音频同步播放';
  controls();
}
async function loadAudio(file) {
  if (!ready || EXPORT || !(file instanceof Blob)) return;
  pause(); clearAudio(); render(0);
  const generation = sourceGeneration;
  objectURL = URL.createObjectURL(file);
  loadingAudio = true; controls();
  ui.status.textContent = '正在读取本地音频…';
  try {
    await new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timeout); audio.removeEventListener('loadedmetadata', success); audio.removeEventListener('error', failure); cancelLoad = undefined; };
      const success = () => { cleanup(); resolve(); };
      const failure = () => { cleanup(); reject(new Error('Audio decode failed')); };
      const timeout = setTimeout(failure, 30000);
      cancelLoad = () => { cleanup(); reject(new Error('Audio selection superseded')); };
      audio.addEventListener('loadedmetadata', success, { once:true });
      audio.addEventListener('error', failure, { once:true });
      audio.src = objectURL; audio.load();
    });
    if (generation !== sourceGeneration) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) throw new Error('Invalid duration');
    mode = 'audio'; loadingAudio = false; audio.currentTime = 0;
    const mismatch = Math.abs(audio.duration - DURATION) > 0.6;
    ui.status.textContent = `${file.name || '本地音频'} · ${audio.duration.toFixed(2)} 秒${mismatch ? ' · 与原音轨长度不同，音乐节点可能不一致' : ' · 本地播放，文件不会上传'}`;
  } catch {
    if (generation !== sourceGeneration) return;
    clearAudio();
    ui.status.textContent = '无法读取此音频，已恢复无声预览。请选择 WAV、MP3 等浏览器支持的格式。';
    controls();
  } finally { if (generation === sourceGeneration) controls(); }
}
const toggle = () => (playing || pendingPlay) ? pause() : void play();
window.player = {
  play, pause, seek, loadAudio, useSilent,
  state: () => ({ready, playing, pendingPlay, mode, time, duration:DURATION, audioTime:audio.currentTime, audioReadyState:audio.readyState, muted:audio.muted, exportMode:EXPORT})
};

if (!EXPORT) {
  ui.play.addEventListener('click', toggle);
  ui.reset.addEventListener('click', () => { pause(); seek(0); void play(); });
  ui.jump.addEventListener('click', () => { pause(); seek(72); void play(); });
  ui.soundtrack.addEventListener('change', () => { if (ui.soundtrack.files[0]) void loadAudio(ui.soundtrack.files[0]); });
  ui.silent.addEventListener('click', useSilent);
  ui.mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    ui.mute.textContent = audio.muted ? '开启声音' : '静音';
    ui.mute.setAttribute('aria-pressed', String(audio.muted));
  });
  ui.seek.addEventListener('pointerdown', () => { scrubbing = true; resumeAfterScrub = playing; pause(); });
  ui.seek.addEventListener('input', () => seek(ui.seek.value));
  function finishScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    const resume = resumeAfterScrub; resumeAfterScrub = false;
    if (resume && time < DURATION) void play();
  }
  ui.seek.addEventListener('change', finishScrub);
  window.addEventListener('pointerup', finishScrub);
  window.addEventListener('pointercancel', finishScrub);
  window.addEventListener('keydown', event => {
    if (!ready || event.altKey || event.ctrlKey || event.metaKey || event.target.isContentEditable || /INPUT|TEXTAREA|BUTTON/.test(event.target.tagName)) return;
    if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) toggle(); }
    else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      event.preventDefault(); pause(); seek(time + (event.code === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 0.25 : 1/60));
    }
  });
  audio.addEventListener('ended', () => {
    if (!ready || mode !== 'audio') return;
    pause();
    if (audio.duration >= DURATION - 0.05) render(DURATION);
    else ui.status.textContent = '本地音频已结束；可切换无声预览继续查看画面。';
  });
  audio.addEventListener('error', () => {
    if (loadingAudio || mode !== 'audio') return;
    pause(); ui.status.textContent = '音频读取中断，请重新选择文件或使用无声预览。';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && (playing || pendingPlay)) pause(); });
  window.addEventListener('pagehide', () => { pause(); clearAudio(); });
}
async function initialize() {
  const started = performance.now();
  while (!window.demo?.ready) {
    if (performance.now() - started > 120000) throw new Error('Renderer initialization timed out');
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  demo = window.demo; ready = true; ui.seek.max = String(DURATION);
  if (!EXPORT) {
    const resize = () => {
      const bounds = ui.screen.getBoundingClientRect(), scale = Math.min(devicePixelRatio || 1, 1.5);
      demo.setSize(Math.max(2, Math.round(bounds.width * scale)), Math.max(2, Math.round(bounds.height * scale)));
      render(current());
    };
    resize(); new ResizeObserver(resize).observe(ui.screen);
    for (const id of ['reset','jump','soundtrack','silent']) ui[id].disabled = false;
    ui.status.textContent = '无声预览 / Silent preview · 可选择本地音频同步播放';
  }
  render(0); ui.loading.hidden = true;
}
initialize().catch(error => {
  console.error('[Apollo player]', error);
  ui.loading.hidden = false; ui.loading.textContent = '画面未能载入，请使用支持 WebGL 的浏览器刷新重试。';
});
