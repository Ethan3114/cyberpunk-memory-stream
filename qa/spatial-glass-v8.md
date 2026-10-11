# 第八版：空间、切幕与玻璃验收

第一幕地面、点云旋转及镜头下降已更新至 [第九版](opening-space-v9.md)。本页开场固定相机和固定点云姿态的描述保留为历史；玻璃与穿模改动继续有效。

2026-10-11。本轮对应固定开场空间、斜向切幕、粒子/脊椎/视频穿模及玻璃容器四项修改。

## 当前行为

1. 第一幕粒子群、官方视频平面和相机不随滚动移动。仅自有 Cyberpunk 字标旋转并向下离开画面；没有整体粒子下沉、镜头推进或字标缩小淡出。原有鼠标流场、粒子回位和稀疏时间浮动继续生效，“固定”指滚动时的空间变换固定。
2. progress .11–.20 使用原站 `FXScrollTransition.glsl` 的斜切与水法线边缘折射。开场和进入的官方环境分别渲染到两个纹理；粒子/视频保留在原空间，切幕揭示下一个画面。合成后继续经过既有 bloom、lens streak 和 GlobalComposite。
3. 粒子按照实际模型范围避让脊椎，并避让四个随屏幕变换更新的玻璃体积。前景粒子也从媒体窗口的投影范围移除，避免直接盖住角色。玻璃边缘折射和脊椎表面反射仍可映出粒子，这种映像并非穿模。结尾四屏改为绕轴展开，修复 David 直线穿过脊椎的问题。
4. 视频容器替换为 0.30 厚的闭合圆角玻璃体，取消金属外壳和独立媒体平面。采用发布版 `WorkItemShader` 的环境折射、屏幕折射、法线与 Fresnel；适配本项目 16:9 视频 UV、色彩取样，减小几何摆动，保留清晰中央视频窗口及冰块般的边缘。这是屏幕空间折射着色，并非物理多次透射或光线追踪。

## 验证

- `particles-v8/opening-fixed.json`：固定视口下，progress .04 / .10 的粒子矩阵、视频平面矩阵和相机完全一致，粒子 uScroll=0。字标 Y 从 −.4796 到 −2.2154，yaw 从 .804 到 2.310。
- `particles-v8/transition-mid.png`：开发锚点 progress .15 的实际渲染，斜向折射边界上方仍是粒子空间，下方为官方街道。
- `particles-v8/glass-check.json` / `glass-v.png`：最新玻璃 shader 近景；保护与排除均启用，角色视频窗口清晰、侧面保留折射厚度。
- `particles-v8/ending-clearance.json`：检查 .94 / .965 / .98 / 1 的真实闭合屏幕变换。脊椎实际顶点径向最大值 .98840049；粒子避让半径 1.13840049。采样屏幕与脊椎包围柱均保持正间距，结尾最小 .41659951 世界单位。测量包含屏幕半宽、半厚及变形余量。该检查使用保守圆柱包络，不是逐三角形连续碰撞求解。
- `particles-v8/ending-glass.png`：最新代码的四屏结尾，David 沿绕轴路线展开后位于左下。
- `particles-v8/production-check.json`：正式 `/cyberpunk/` 子路径，通过真实 PageDown 达到 progress .1526、transition .4608；原生 End 至 progress=1，orbit=150°，4 屏，运行中最小屏幕/脊椎间距 .41659951；退出的视频全部暂停。实际点击 REPLAY 后回到 progress=0，scene-02 恢复播放，错误日志为空。正式版不依赖开发 `?at` 参数。
- TypeScript / Vite 构建通过：`VITE_BASE_PATH=/cyberpunk/ npm --prefix site run build`。最终 JS 1,022.72 kB，gzip 267.23 kB；保留 >500 kB 单包提示。

视觉锚点截图为实际 CSS 1072×670、设备 DPR 3.82、渲染 DPR 上限 1.5；未将设备尺寸覆盖值标记为截图分辨率。生产检查记录真实 DOM 状态，视觉图使用固定开发锚点避免截图期间滚动位置变化。未做跨设备性能基准、60fps 保证或公网部署。

修复了环境素材异步加载时数组尚未填满的读取问题；加载中的稀疏项现在跳过，避免偶发触发静态降级。旧 tab 的历史错误没有用于新生产验收。

## 来源与边界

公开 shader：[Active Theory compiled.vs](https://activetheory.net/assets/shaders/compiled.vs)；玻璃/切幕法线：[waternormals.jpg](https://activetheory.net/assets/images/tree_room/waternormals.jpg)。本地 shader 位于 `site/src/ReferenceShaders.ts`，调度在 `ReferencePostFX.ts` / `Panels.ts`，法线来源见 `materials/supplemental/reference-glass/README.md`。

延续第七版的原算法/postFX/FBR 移植；没有执行原 Hydra 应用、替换为 AT 品牌模型或声称整站像素级还原。自有字标、官方环境、无绿色霓虹粒子和已确认的 50°/角色轨迹保留。
