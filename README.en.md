# Apollo — A World Away

[中文（默认）](README.md) | **English**

An Apollo 11 concept music video drawn in the browser. Procedural spacecraft, lunar terrain, engineering diagrams and typography follow the rhythm of Public Service Broadcasting’s **Go!**: individual judgments gradually become one collective action.

![A frame from the original film](docs/assets/preview.jpg)

This repository preserves the renderer for the **original 4:12.73 film**, together with a new standalone player and export tools. It does not include later revised scenes, the commercial recording, or a finished video containing that recording.

## A landing made by many people

The film starts with work on Earth and a distant destination. Each Go establishes another condition for descent. The vehicle’s motion returns new evidence to the ground; alarms, terrain, velocity and remaining capability test the plan against reality. Landing is followed by another decision: whether the crew can stay.

The ending reconnects Eagle on the surface, Columbia in lunar orbit, and the team on Earth. Arrival is an achievement sustained by continuing collaboration.

The creative rule is simple: **density should keep adding understanding, not merely objects.** Labels, lines and models explain changing relationships. Each Go is both a rhythmic impact and a step in the visual argument. See [sources and interpretation](docs/SOURCES.en.md).

## Preview locally

Requires **Node.js 20 or newer** and a modern WebGL2-capable browser.

```bash
git clone https://github.com/Epsilonmeow/apollo-go-mv.git
cd apollo-go-mv
npm start
```

Open **http://127.0.0.1:5199/**. Preview does not require `npm install`; Three.js and the font resources are included locally.

- Preview the whole film silently and seek to any shot.
- Select an audio file you are entitled to use. The browser reads it locally; **it is not uploaded to the server**.
- For the existing timing, use the full recording of Go! from its beginning, without added silence or edits. The original production track was **252.720544 seconds** long. Other editions may need timing adjustments.
- Use a normal audio format that your browser can decode. The player does not download music or process protected containers such as NCM.

## Export an image or video

Export uses a separate headless Chromium to render frames. It does not operate your everyday browser. Install the development dependencies and browser first:

```bash
npm install
npx playwright install chromium
```

Video export also requires FFmpeg. If it is not on `PATH`, set `FFMPEG_PATH` to the executable’s full path. `CHROME_PATH` can select an existing Chromium/Chrome executable; `PLAYWRIGHT_MODULE_PATH` can select an external Playwright installation.

A still image:

```bash
npm run render -- --still --time 77.35 --output output/preview.png
```

Try a two-second silent clip first:

```bash
npm run render -- --start 76 --duration 2 --fps 30 --width 1280 --height 720 --output output/sample.mp4
```

Render the full film with your own audio file:

```bash
npm run render -- --audio "/path/to/Go!.wav" --output output/apollo-go.mp4
```

Full export defaults to **1920 × 1080 at 60 fps**: **15,164 frames**, approximately 252.733333 seconds. The original track ends about 12.8 milliseconds before the final frame ends because the frame count is rounded up. Frame-by-frame export can take substantial time; test a short clip first. Local files in `output/` are ignored by Git.

The tool writes a `.report.json` beside the output with progress and verification results. It refuses to overwrite existing outputs by default; choose a new filename or explicitly add `--overwrite`.

## Structure and checks

| Location | Contents |
| --- | --- |
| `film/` | 26 original rendering modules in their segment directories, 2 Three.js modules and font resources |
| `docs/ARCHITECTURE.en.md` | Rendering, timeline, player and export architecture |
| `docs/SOURCES.en.md` | Historical references, audio provenance and interpretation |
| `docs/assets/preview.jpg` | A silent frame from the original film |
| `output/` | Ignored local export directory |

```bash
npm test
npm run check
```

`npm test` checks static files and the local server. `npm run check` checks the public player and rendering entry point in a browser, requiring the development dependencies and Chromium above. These checks do not establish pixel-identical output across every GPU, browser and font environment, or replace watching an exported video.

## Creation and licenses

See [public release checks](docs/VERIFICATION.md) for the checks completed and their limits.

**Epsilonmeow** directed the concept, reference analysis, feedback and acceptance, working with **Codex / GPT6-Astra** on iterative design, implementation and project preparation. Models are procedural; the film combines Three.js, Canvas 2D and shaders.

- Original source code and documentation: [MIT License](LICENSE).
- Three.js: MIT License. Archivo: SIL Open Font License. Their license notices are retained with the dependencies. Consolas is a system font name and is not distributed here.
- Music: **Public Service Broadcasting — Go!**. The song and its recording are outside this repository’s MIT license. Neither the recording nor a music-containing MP4 is distributed here.
- NASA archives, Apollo Journals commentary and other external material retain their respective provenance. Citations do not relicense those materials under MIT.

You can study, modify and render the code. For a new release containing music or other third-party material, confirm the permissions for those materials separately.
