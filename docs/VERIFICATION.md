# 公开工程检查 / Public release checks

2026-10-26：本次整理保留了 4:12.73 原版的渲染逻辑，新增独立播放器、本地服务和可移植导出工具。

完成的检查 / Completed checks:

- 31 项原版文件与归档的 SHA-256 一致，包含 26 个原创渲染模块、2 个 Three.js 模块、字体和两个许可证。见 [manifest](original-source-manifest.json)。
- 31 个关键时点有正常画面；以不同顺序回跳这 31 个时点，同一测试环境内的像素差为 0。
- 390 像素宽的播放器没有横向溢出；无声播放、暂停、跳时正常。
- 选入程序生成的测试 WAV 后，画面跟随音频时钟；跳到 100 秒再播放正常。测试不使用或分发歌曲录音。
- 2 秒、1280 × 720、30 fps 的无声视频导出 60 帧，完整解码及图像方向检查通过。
- 1 秒、640 × 360、30 fps 的测试音视频导出 30 帧，混流与解码通过。
- 浏览器检查期间没有脚本错误、外部资源请求或加载失败。

The checks above verified original-source hashes, 31 keyframes and deterministic seeking, a narrow player layout, silent and local-audio playback, and short silent/audio exports. They used a private headless Chromium instance, not a user's browser session.

这里没有重新导出或逐帧检查整部 15,164 帧影片；短片验证不等于全部平台、显卡或浏览器的完整验证。仓库中的预览图来自原版代码重新渲染。

The public packaging has **not** undergone another full-length 15,164-frame export. Short export checks do not establish identical results on every platform, GPU or browser. The README preview was rendered from the original code.

可运行 `npm test` 和 `npm run check` 重做检查。浏览器检查和视频导出需要 README 中列出的额外工具；本地生成的详细报告保存在忽略目录 `output/`。
