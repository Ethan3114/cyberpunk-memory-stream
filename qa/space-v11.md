# 第十一版：浮动字幕、倒置空间与首尾形变

2026-10-11。v10 已发布；本轮重新安排收尾，不再展示四屏总览。

## 当前实现

- 移除页脚 CYBERPUNK 2077 · EDGERUNNERS、全局进度条、00/04 计数与顶部章节名称；角色字幕只保留左下角姓名和短句。
- RoundedBox 玻璃深度 .30 → .15；圆角 .075 → .0375；粒子隔离体和玻璃距离测量同步减薄。
- 角色字幕使用独立细分平面，复用原 WorkItemUIShader 顶点的 z 曲率、鼠标悬浮前移、x/y 斜度；片元适配左下角版式，保留视角偏移、RGB 分离及距离淡出。原站居中 UI 的 UV 缩放未照搬，否则左下角内容会被裁掉。
- 三处切幕均使用原 FXScrollTransitionFragment 与 waternormals：开场 → 环境 .11–.20，最后环境 → 脊椎 .49–.595，Lucy → 倒置空间 .87–.92；倾角来自原 FXScroll 配置 .7。各场景分别渲染后再斜向合成，避免用镜头跨两个空间造成投影穿插。
- 原场景 Home 用正向 uScroll，Footer 用 1-scrollProgress。当前 SpaceTimeline 将开场粒子参数 0→1，结尾 1→0；保留 ParticleTest 的 funnel、scrollMove 和 uVisible 位移逻辑。粒子总数保持 65536，未通过随机删点实现虚无。
- 开场镜头/标志共同从 y=16.64/16 降至 .64/0 后继续下降；结尾在 .935–1 从 .64/0 移至 -17.36/-18，粒子与背景视频倒置。开场第一次加载 uVisible 使用原 5 秒可见性渐变；结尾使用反向滚动离开空间，最终标志高光降低。
- 第二幕四个角色仍按 V、Jackie、David、Lucy 环绕；每段 50°。从 .92 起脊椎、角色屏幕和两团脊椎点云全部隐藏，返回视频点云空间。

## 源码依据

- research/active-theory/live-app.js 的 Home、Footer、ViewController、WorkItem、WorkItemUIShader（本地研究副本）。
- https://activetheory.net/assets/shaders/compiled.vs 的 ParticleTestShader、WorkItemUIShader、FXScrollTransition。
- 此次仍为原算法适配到项目 Three.js 场景，并非恢复原站完整引擎或像素一致。

## 可回退记录

- qa/checkpoints/v10-before-revision.zip：改动前源代码。
- qa/checkpoints/v11-space-baseline.zip：基础改动完成，未加入首尾虚无实验时的源代码；运行素材仍在 site/public/assets。
- 最终实验代码包含 SpaceTimeline.ts；回退应删除该文件后解压基础快照覆盖 src，再 npm --prefix site run build。

## 验证

- TypeScript 与 GitHub Pages 子路径构建通过；JS 1027.29 kB，gzip 268.56 kB；仍存在 >500 kB 单包提示。
- 实测 CSS 1072×670，DPR 3.82，渲染 DPR 上限 1.5；截图已显式覆盖整个绘制区域，实际文件 1072×670。
- timeline-check.json 记录开场/稠密空间/环境→脊椎切幕/倒置空间/结尾虚无；首尾 uScroll 为 0→1 与 1→0，结尾 coreVisible=false、visiblePanels=0。
- 开场、结尾、斜向中间帧及浮动角色视频截图存于 qa/particles-v11/。Jackie 视频实际播放、readyState=4；检查时没有着色器运行错误。
- 真实 PageDown：progress=.0517，镜头 y=4.301；原生 End：progress=1、镜头 y=-17.36、visiblePanels=0、scene-02 readyState=4 且实际播放；REPLAY 回到 progress=0，errors=[]。
- 基础版本 GitHub 存档提交：843b6b0658a9c37f995861601e206078ea963cca。
- 本轮公网发布与补验进行中。
