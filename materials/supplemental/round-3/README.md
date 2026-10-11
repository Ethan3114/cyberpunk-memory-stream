# Cyberpunk 2077 落地页 · 第三轮补充素材

本轮交付：**4 组场景媒体 + 4 组角色媒体 + 1 个开场字标模型**；粒子代码按任务范围延后（见 `particles/README.md`）。
所有素材均来自 CDPR / Netflix 官方渠道，**无 AIGC、无 GIF/静图缩放冒充视频、无音轨、未改动 `site/src/**`、未部署**。

- **离线候选板（先看这个）**：双击或用本地静态服务器打开 [`candidate-board.html`](./candidate-board.html)，可直接播放/查看全部候选媒体（纯相对路径，无 CDN 依赖）。
- **机器清单**：[`manifest.json`](./manifest.json)（相对路径、角色/场景、main/alternate、来源 URL、置信度、原始时间码、宽高/时长/fps/codec/字节、处理步骤、SHA-256、验证状态）。
- 视频统一规格：MP4 / H.264 / yuv420p / **无音轨** / `+faststart` / 1920×1080 / 单段 ≤8MB；Edgerunners 动画源 24fps，游戏/KV 源 30fps；海报为 1920 宽 WebP。
- 主选媒体总量见 `manifest.json -> totals`（预算 ≤60 MiB）。

> 建议用本地服务器查看候选板（`file://` 下个别浏览器对本地视频有限制）：
> 在本目录执行 `python3 -m http.server 8013` 后访问 `http://localhost:8013/candidate-board.html`。

---

## 一、开场字标模型（`opening/`）

| 文件 | 说明 |
|---|---|
| `cyberpunk-wordmark.glb` | 由 `materials/supplemental/opening-model/decor_3.stl` 转换的真实二进制 glTF（glTF v2，1 mesh / 460 三角面，bbox 4.00×0.98×0.105，居中、正面朝 +Z，黄色金属材质 `cyberpunk-yellow-metal`），已用 GLTFLoader 重新 parse 校验 |
| `preview-front.jpg / preview-oblique.jpg / preview-side.jpg` | headless Chrome WebGL 三视角渲染（正面字形 / 斜侧厚度 / 侧面冷色轮廓边） |
| `scroll-sample.html` | 滚动驱动旋转样例：滚动进度 0→1→0 对应 正面→侧面→背面（镜像，非破面）→侧面→正面；**静止时无自转**（已用 3s 静止双截图 MD5 一致验证）；尊重 `prefers-reduced-motion` |
| `scroll-sample.mp4` / `scroll-sample-sheet.jpg` | 样例录屏（1920×1080/30fps/8s/无音轨）与 8 帧拼图 |
| `opening-notes.md` | 接入说明、灯光参数、已知取舍（无倒角、无 UV） |
| `wordmark-geometry.js`、`vendor/three.module.js`、`vendor/three.core.js`、`build/` | 几何源码、three r186 依赖与 STL→GLB 转换脚本 |

**可直接接入。** 接入方把 `.glb` 作为静态资源加载，按 `scroll-sample.html` 的进度映射控制 Y 轴旋转即可。

## 二、4 组场景（`scenes/01..04/`）

预告片/环境片源中干净单镜头仅 1–3s，因此视频均为**多镜头硬切 montage**（标 `not-seamless`，交给浏览器循环，不做文件内无缝循环、不做定格/变速/Ken Burns 造假）。

| 场景 | 主选 | 备选 |
|---|---|---|
| 01 雨夜街道 | `main.webp` **官方 4K 静图**（雨夜窄巷，角标已裁） | `alternate.mp4` 6.6s 湿/潮夜街 montage（Postcards 霓虹街市 + pl_teaser Dogtown 湿街水印前窗口） |
| 02 繁忙霓虹街区 | `main.mp4` 6.1s 霓虹街区 montage（Postcards，已避开烧录 `WWW.NIGHTCITY.LOVE` 横幅） | `alternate.webp` 官方 4K 霓虹大道静图 |
| 03 工业/地下 | `main.mp4` 6.9s 绿色钢构 + 地下看台 + 橙火残骸（pl_teaser，纯环境） | `alternate.webp` 官方 4K 橙黄工业城静图 |
| 04 企业建筑空间 | `main.mp4` 6.8s 殿堂 + 黄昏空中城景 + Arasaka 屋顶花园（pl_teaser + Launch + Postcards） | `alternate.webp` 官方 4K 企业巨构静图（Welcome to Paradise） |

每段含同名 `.webp` 海报。**全部可直接接入。**

## 三、4 组角色（`characters/{v,jackie,david,lucy}/`）

| 角色 | 主选 | 备选 | 静图 |
|---|---|---|---|
| 女 V | `main.mp4` 官方 Phantom Liberty 动态主视觉（8s，红发女V） | `alternate.mp4` 官方 Ultimate Edition 动态主视觉（8s，已剥离 AAC） | `still-fallback.webp` 官方 4K 女V 权威形象 |
| Jackie Welles | `main.mp4` E3 2019 剧情预告 车舱连续场景（6.0s，Jackie 受伤靠坐、男V 在旁，Jackie 全程在画） | `alternate.mp4` 7.1s The Gig + Launch + E3 七段 Jackie montage（荒野/酒吧/柜台/公寓/正脸/车中/沙发，逐帧核对） | `still-fallback.webp` 官方 4K「Just in time for dinner」 |
| David Martinez | `main.mp4` 6.2s Edgerunners 动作 montage（首帧即黄夹克举红枪） | `alternate.mp4` 6.2s 义体启动主题 montage | — |
| Lucy | `main.mp4` 6.2s 坠落 + 天台银白 Bob 背影（「月球」氛围段） | `alternate.mp4` 7.4s 紫调环瞳正脸 + 网络潜入（含世界内 CALL HUD） | — |

- David/Lucy 仅取自**官方 Edgerunners 预告/teaser**（未采完整剧集）；右上角 NETFLIX 角标已用 1.25× 非对称 zoom-crop 去净（已逐帧复核四角无残字），所有字幕与标题卡均已避开。
- Jackie 身份以 Press Center 官方角色渲染 `_sources/JACKIE_OFFICIAL_RENDER_2020.jpg` 为基准逐帧核对（曾排除 Animals 摔跤手、Johnny Silverhand 等误判）。

## 四、阻塞项与合规替代（均已闭环，无遗留缺口）

1. **女V 无官方引擎实拍母版**：已穷尽 CDPR Press Center（Cyberpunk 2077 项目共 85 个媒体集）——Launch Trailer / The Gig 主角均为男V（结尾角色卡为男V，女性近景为 Judy/Rogue 等）；Switch 2 b-roll 全带 HUD/任务文字/「Captured on Nintendo Switch 2」水印；Phantom Liberty 预告在该站仅 YouTube 嵌入、无可下载母版。按任务 fallback 规则交付**两段官方女V 动态主视觉 + 一张官方 4K 静图**，均明确标注为 motion-poster / still，**非引擎实拍**，未用男V 画面、未用 AI 或放大造假。
2. **场景01 无真正雨夜运动镜头**：Postcards 为干燥霓虹 b-roll，pl_teaser 唯一湿街窗口带「FOOTAGE CAPTURED ON PC」水印。主选用官方 4K 雨夜静图，备选为湿/潮夜街 montage。

## 五、已知取舍

- 全部角色/场景视频为 `not-seamless` 多镜头 montage（官方预告片干净单镜头仅 1–3s），按浏览器 `loop` 方式接入。
- Edgerunners 片段经 1.25× 裁切去角标，构图已逐源核对；Lucy 主选为背影氛围镜头（银白 Bob 可辨），可读正脸在备选。
- 开场 GLB 无倒角/无 UV（细长笔画风险高、本机无 Blender），详见 `opening/opening-notes.md`。
- 来源置信度与许可：所有媒体为 CDPR/Netflix **官方发布**（press.cdprojektred.com 母版、cdn-l-cyberpunk.cdprojektred.com 官方图库、cyberpunk.net 官方页面），置信度见 `manifest.json`；**未标记为开源/CC0**，版权许可不是本轮前置，发布前请按官方粉丝内容指南与项目法务口径复核。

## 六、源母版登记（`_sources/`，不随页面加载）

高清母版通过 CDPR 官方 Press Center 媒体 API 获取（Cyberpunk 2077 = project 224，媒体免鉴权托管于 `press.cdn.cdpr.app`）：

- Launch Trailer（4K，男V+Jackie）、The Gig（1080p，男V+Jackie）、Postcards from Night City（实际 4K 环境 b-roll）、E3 2019 Cinematic（4K HEVC，Jackie）、角色渲染包（Jackie 身份基准）。
- 清单与直链：`_sources/press-center-sources.json`；早期静图来源审计见 `../provenance/`。
