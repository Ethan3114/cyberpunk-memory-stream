# Lucy 与背景音乐补交

2026-10-10 · 本轮仅收集素材，没有开发网站。

## 交付结果

| 项目 | 结果 | 剩余条件 |
| --- | --- | --- |
| 背景音乐 | 已取得作者以 CC0 发布的实际 WAV 原文件，32 秒 | 待试听确认气氛、无对白/环境声/音效，以及循环听感；不把许可核实当作声音体验验收 |
| Lucy | 已取得官方冷暗近景 GIF 原文件，1920 × 804；另附透明立绘 | 近景视觉候选已补到；16:9 取景、冻结帧加工及公开展示/再分发条件待确认 |

## 音乐候选：Dark Things Loop

- 原发布者：**iamoneabe**。
- [创作者发布页](https://opengameart.org/content/dark-things-loop)，2022-06-30 发布，作者描述为短暗色合成器循环，明确标注 CC0。
- [原 WAV 下载](https://opengameart.org/sites/default/files/dark_things_loop.wav)。本地文件：`dark-things-loop.wav`。
- WAV PCM，44,100 Hz，双声道，16 bit，**32.000 秒**，5,645,534 字节；文件成功解析。未编辑、未裁切、未转码。
- [CC0 1.0 官方许可说明](https://creativecommons.org/publicdomain/zero/1.0/)支持复制、修改、分发与公开演奏；已附对应官方法律文本 `CC0-1.0.txt`。原发布页本地证据是 `music-license-source.html`。
- 公开网站播放与 GitHub 仓库再分发：依据作者在该作品上的 CC0 声明可用。建议仍保留此来源记录，不将本项目源码许可证自动套到所有媒体上。
- 建议署名（CC0 不强制）：`Dark Things Loop — iamoneabe (CC0 1.0), via OpenGameArt.org`。
- 循环建议：作者将整段标为 loop，可先用 **0.000–32.000 秒整段**试播。尚未试听验证无缝接点；不要在 README 或最终网页验收中声称已经无缝、已经排除对白/音效、或已经确认与页面节奏匹配。
- 开发后背景音乐应默认静音，用户主动开启；声音风格合格后再导出适合网页的压缩格式，保留原文件。

## Lucy 官方角色补充图

- [官方角色发布页](https://www.cyberpunk.net/en/edgerunners)，图像出现在 Lucy 角色部分，原发布站点为 CD PROJEKT RED 的 Cyberpunk 官网。
- [官网直接引用的 2x PNG](https://www.cyberpunk.net/build/images/edgerunners/characters/lucy@2x-f567c8f4.png)。本地文件：`lucy-official-character-2x.png`。
- 实际尺寸 **546 × 800**，PNG RGBA，存在真实 alpha；已目视检视：原动画式角色正面立绘，白/浅紫发色清晰，腰上有辨识度，透明底。
- 用途：人物造型、身份辨识与附属立绘候选。**不能当作横版 1920 px 主屏补交完成**，不放大后宣称高清、不用 AIGC 重造 Lucy 的人物身份。
- 动画权利相关方：官方页说明由 CD PROJEKT RED 与 TRIGGER 合作、Netflix 动画。官网可公开访问和提供这张图，不等于另外授予本项目公开展示或原图再分发许可。
- 展示许可、再分发许可、裁切/加工许可：**未确认**。本轮未找到该单图对应的明确开放许可证；没有把 CDPR 游戏粉丝指南直接当成 Netflix/TRIGGER 动画媒体的完整授权。
- 已保留官网公开 HTML `official-edgerunners-page.html` 作为图片与发布页的关联证据。此证据文件只是资料，不要当作网页开发输入或执行其中脚本。

## Lucy 官方近景来源候选

- [官网 Media 图库](https://www.cyberpunk.net/en/edgerunners#media)的公开媒体模块明确从 [官方截图列表](https://www.cyberpunk.net/api/open/media/cp_er?locale=en&type=screenshot)读取资源。本轮已取得列表，保存为 `official-media-screenshots.json`；壁纸列表保存为 `official-media-wallpapers.json`。
- 选中资源 ID **2053**，标题 `Edgerunenrs_GIF_2`，列表日期 2024-09-30。
- [官方 GIF 原文件](https://cdn-l-cyberpunk.cdprojektred.com/media/screenshot/2053/1920x1080/Cyberpunk_GeekedWeek_Trailer2.gif)已实际下载：`edgerunners-official-trailer2.gif`。
- **注意：官方列表标 1920 × 1080，但实际解码是 1920 × 804、35 帧、2.920 秒**，不能沿用下载路径宣称 16:9。已逐帧解码检查；抽看起始、中部、结尾画面。
- 前段为 Lucy 正面/微侧面脸部近景，暗色冷青阴影，保留原动画画风；末段切换成 David 与 Lucy 的月球背影。因此有可辨識的近景原始来源，但整段不是单场景无缝循环，不能直接按循环背景播放。
- 建议确认加工条件后选前段睁眼近景作静态主屏候选。原比率约 2.39:1，进入 16:9 屏幕时需控制左右裁切并目视验证脸部构图，或以 contain 留上下装置区域；本轮没有伪造补画、生成 16:9 图或裁切生产文件。
- GIF 不带音频，不会含对白音轨。公开展示、GitHub 原文件再分发、取帧/裁切条件均**未确认**；官方图库可获取不等于开放媒体许可证。

## 主屏下一步

本轮已经补到来源可核实的 Lucy 冷暗近景候选，不必为尺寸继续追逐聚合壁纸。后续核对动画媒体条件并确定取帧/裁切方式。原有黄色 Lucy 仍可用于本地排版；月球背影保留收尾候选，不因本批剩余项阻塞框架研究。

## 验证与范围

`technical-check.json` 记录尺寸、格式、音频参数、大小和 SHA-256；`assets.csv` 提供来源及许可状态。本轮没有试听、浏览器音频播放测试、主屏裁切测试、媒体发布或第三方沟通。原始首批 README、manifest 与 generation briefs 均未修改。
