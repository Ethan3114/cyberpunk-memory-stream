# 原站算法移植与第七版验收

当前空间、切幕及视频容器实现已更新至 [第八版验收](spatial-glass-v8.md)。下文保留第七版的算法与测试记录；其中 uScroll 映射、淡出及屏幕实现描述已被第八版替代。

2026-10-11。本轮针对「粒子像果冻蠕动、鼠标上下浮动不同」进行修改。本文件替代第六版验收中的当前实现说明，历史截图保留。

## 移植依据

公开源文件：https://activetheory.net/assets/shaders/compiled.vs

本地研究副本：`research/active-theory/live-app.js`、`compiled.vs`、`live-uil.json`。重新下载的当前线上 UIL 有 2593 个配置项，解析后与此前副本完全相同；确认使用的是页面配置覆盖后的粒子代码，而非运行库里的默认流场预设。

## 已接入的算法及范围

| 模块 | 现在的实现 | 与原站的差异 |
|---|---|---|
| MouseFluid / Fluid | 原始 splat、curl、vorticity、divergence、pressure、gradientSubtract、advection GLSL；128² 像素单位速度场、512² dye mask；20 次压力迭代；CURL 30；速度/密度/压力衰减 .98/.97/.8 | Three.js ping-pong RT 主持调度；dt 与衰减按时间归一；首次/零长度输入保护，避免原线段算法 0/0 |
| 粒子位置预设 | 原站投影、相机 world basis、mask、uMouseStrength=100；target 受流场推动；pos 向 target 以 .07×HZ 一阶插值 | Float32 GPU 位置纹理；移除了项目弹簧速度纹理、全局 curl、随机云团形变 |
| ParticleTestShader | 原始 funnel、scrollMove、近 logo 回避、稀疏轻浮动、噪声 ripple、距离尺寸、稀有 sparkle、视频 overlay、旋转气泡 matcap 和 soft-light 着色 | 65536 点使用原 forest 数据；自有霓虹色替代原绿色；位置/点尺寸按 .43 的项目空间适配；uScroll 映射到第一幕；uVisible 固定 1，由项目淡出控制；饱和度/负值保护避免 sqrt 的 NaN。撤掉大范围 CoC 模糊和软边 |
| VolumetricLight | 原 2-pass blur9 + 20 次 radial sampling；home 配置 exposure .86、decay .8、density .22、weight .34、clamp 1，合成强度 1.1；光源投影跟随字标 | 输入为项目模糊官方视频的径向遮罩，亮度 .35，字标作为黑色深度遮挡；没有照搬原站弯曲视频平面及 MRT 层 |
| UnrealBloom | 原 Gaussian、3 个 mip、3/5/7 核、1/.8/.6 权重、bloomRadius 插值；第一幕 .6/.8，第二幕 .5/.5；原配置 threshold=0，故直接模糊 | 缓冲尺寸按项目 drawing buffer 的 .3 分配；主画面/home 使用 8-bit 范围避免现有金属字标 HDR 高光把整段文字冲白；blur 和其他 FX 保留 HalfFloat |
| HydraLensStreak | 原 prefilter、8 级横向 downsample、6 次 upsample、CompositeStreak 的色差 halo、ring；保留发布代码调度及未实际使用的 tHigh 参数 | 原参数保留，阈值从 1 调为 .42，让项目受限亮度的画面产生镜头光晕 |
| GlobalComposite | 已展开并接入完整公开 fragment shader，包括 bloom/streak 幂次、noise grain、corner glow、frost 及 RGB 位移代码 | Contact/Chat 等无对应交互的控制固定为 0；UI 混色使用紫色；最终按原 shader 直接输出，不再额外套一次 sRGB 转换；视频取样显式解码，reduced 模式冻结 time |
| Spine getFBR | 原 getFBR 微表面分布、几何遮蔽、MRO、matcap、导数法线、SpineShader 屏幕反射；normal .19、light [1,1,1,.4]、reflection [2.7,.85] | 添加 Three.js instanceMatrix / 淡出支持；uColor 改为无绿的 #d1eeff；仅脊椎主体，项目附加机械件仍使用 StandardMaterial |

第一幕字标仍是用户自有 GLB、金属材质与项目反射；没有把原 AT 字标或 HomeLogoShader 整套外观移过来。字标薄片的正侧背面旋转、四段官方环境及已确认的角色镜头路线保留。第二幕的两个 flower_spine 点云、角色屏幕和 50°/角色的环绕保持原项目实现。

这里的「移植」指明确列出的公开算法、shader 与 pass。未在项目中执行原站 Hydra 应用 JS，也未恢复原站完整场景树、模型组合、camera/load/drag timeline，因此不能称为整站引擎或像素级 1:1 移植。

## 实测

浏览器实际 CSS 视口 1072×670，DPR 3.82，WebGL 渲染 DPR 上限 1.5；截图实际也是 1072×670。浏览器设备尺寸覆盖值并不等于 CSS 视口，未将截图称为 4K / 1440 CSS。

1. `pointer-check.json`：原生鼠标沿同一竖线向上、向下拖动。读取整个 256² Float32 位置纹理，而非仅第一行离屏点。静止基线位移 0；上移最大 Y 位移 +3.087、9985 个点 |dy|>.05；下移 −3.790、6597 个点。停止后最大残留位移 0.00000573，|dy|>.05 点数归零；全部 65536 个位置均有限。数据是源点云局部坐标，非 CSS 像素。
2. `fx-check.json`、`fx-on-poster.png`、`fx-off-poster.png`：同海报、同 progress=0、reduced 模式冻结时间的后期开关对照。三个开启通道分别输出非零平均值 .01965 / .10759 / .03187；关闭三项后均为 0。`fx-pixel-diff.json` 记录图像平均通道差 14.59/255。这证明效果确实参与渲染，不代表与原站像素一致。
3. `core-check.json` / `spine-fbr.png`：40 段实例脊椎及 FBR 实际编译、渲染，最终检查范围内无 shader 错误。四张原始 FBR 图片已核对尺寸/格式并纳入素材准备脚本。
4. `jackie-check.json` / `jackie-video.png`：角色视频实际加载、静音播放，摄像机 orbit=50°；FBR 与角色屏幕同场景运行。
5. `production-check.json`：正式 build 在 `/cyberpunk/` 子路径真实播放 scene-02；同一文档原生 End 滚动到 progress=1，orbit=150°、4 屏；开场视频暂停，blend 归零；新生产检查 tab 的 errors=[]。
6. TypeScript / Vite 构建通过；最终 JS 986.01 kB，gzip 260.64 kB。仍有单包 >500 kB 提示。未声称 60fps，未做多设备性能基准或 GitHub 公网部署。

GPU 不可用时第一幕为静态参考点云，不再用另一套 CPU 弹簧冒充原站交互。Reduced 模式使用海报、静态粒子和冻结后期时间；本轮开关对照中 7 个视频均 paused。

## 调试与文件

- `?probe=1`：读取真实 GPU 流场、全部位置及 FX RT，成本较高，仅用于验证。
- `?fx=off` 或 `?fx=bloom,streak,volume`：开发环境的禁用项对照。
- `?motion=reduce` / `?particles=cpu`：静态降级检查。
- `site/src/ReferenceShaders.ts` 保存展开后的公开 GLSL；Fluid、Particles、ReferencePostFX、ReferenceFBR 分别负责调度。
- FBR 来源见 `materials/supplemental/reference-fbr/README.md`；所有线上运行素材由本项目静态路径加载，不依赖参考站可用性。
