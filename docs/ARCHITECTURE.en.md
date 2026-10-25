# Architecture

[中文](ARCHITECTURE.md) | English · [Project home](../README.en.md)

The public project combines the original film renderer with standalone playback, serving and export tools. Rendering modules retain their segment directories so later experimental shots are not mixed into the original 4:12.73 film.

## From time to a frame

```text
The player or exporter supplies film time t
  → finale/main.js selects the segment
  → timing.js / segment state functions determine the shot and impact
  → Three.js updates procedural geometry and the camera
  → Canvas 2D draws typography and engineering relationships
  → a shader composites the scene and transparent graphics
  → WebGL canvas
```

The actual entry point is `film/apollo-finale/main.js`. It reuses the earlier segment modules rather than joining finished video clips.

| Film time | Main module directory | Content |
| --- | --- | --- |
| 0–46 s | `apollo-go/` | Ground systems, Earth–Moon distance, judgment chain and orbital standby |
| 46–88 s | `apollo-first-go/` | Preparation, first Go poll and collective approval |
| 88–111.8 s | `apollo-descent/` | Powered descent, force and motion, terrain observation and telemetry |
| 111.8–144 s | `apollo-second-go/` | Repeated responses, current performance, future capability and landing clearance |
| 144–184 s | `apollo-landing/` | Computer alarms, final approach, contact and landing |
| 184–214.8 s | `apollo-stay/` | Continued operation after landing and the Stay decision |
| 214.8 s–end | `apollo-finale/` | Reconnecting the surface, orbit and Earth |

These are film times, not Apollo mission times.

## Three rendering responsibilities

- **Space modules** manage geometry, materials, lighting, cameras and scene anchors. The spacecraft, terrain and Earth are procedural visual models, with no external 3D model download required.
- **Graphics modules** draw typography, lines, relationships and state changes in Canvas 2D. Some annotations use projected 3D anchors to stay near the object they explain.
- **Compositing** turns the graphic canvases into textures and combines them with the 3D render target, adding restrained impact scaling, noise and vignette. Main typography uses Archivo; monospaced text uses a system font stack including Consolas.

Graphics were composed at 1920 × 1080. Changing export resolution does not create a new portrait layout. System monospace fonts, text rasterization and WebGL implementations can produce small visual differences.

## Playback and explicit-time rendering

The entry point exposes `window.demo`, including `ready`, `duration`, `render(t)`, `setSize(width, height)` and `stats()`. Export tools must wait for fonts and scenes to initialize before capturing frames.

During playback the player supplies the current time, following the audio clock when local audio is selected. During export the tool supplies `start + frameIndex / fps`, making frame count and shot positions repeatable regardless of how long a screenshot takes.

Animation is primarily calculated from absolute time, so a frame can be inspected without playing everything before it. This supports seeking and repeatable checks, not a guarantee of pixel-identical results across hardware.

## Export and verification

The exporter starts a local server and a separate headless browser, waits for the renderer, and generates frames at specified times. Video export passes those frames to FFmpeg. Audio comes only from a local file explicitly supplied by the caller. See the [README](../README.en.md#export-an-image-or-video) for commands.

- `npm test`: static-file and server checks.
- `npm run check`: browser checks for the player and rendering entry point.
- Short export: verify the actual browser, GPU, fonts and FFmpeg combination before a full render.
- Final viewing: check the audio edition, synchronization, text, images and ending.

Segment exports and preserved-frame comparisons from the original production are historical validation. They do not replace testing the public project on a new machine, and are not presented as evidence of a new full render.
