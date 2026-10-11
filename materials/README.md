# NIGHT CITY — 素材包（materials）

本目录是 NIGHT CITY 单页网站的**素材收集交付物**。本批只负责收集、整理、记录许可，
**不包含网站开发/部署**。素材严格按《设计方案.md》的固定区块顺序整理：
**CITY → V → WELLES → DAVID → LUCY → CORE → FONTS**。

- 视觉候选板（推荐先打开）：`visual-board/index.html`
- 机器可读清单：`asset-manifest.csv`
- 缺口与原创建模简报：`generation-briefs.md`

---

## 1. 目录结构

```
materials/
├── README.md                 # 本文件：推荐候选 + 许可总览
├── asset-manifest.csv        # 全部素材的来源/许可/构图/故事字段
├── generation-briefs.md      # CORE 原创建模简报 + 缺口 + 视频方向
├── visual-board/
│   └── index.html            # 缩略候选板（按固定顺序排列，可直接浏览器打开）
├── images/
│   ├── city/                 # HERO 夜之城街道候选 ×3
│   ├── characters/           # V / Jackie / David / Lucy 各 ×2
│   └── core/                 # 机械神经主干参考 ×3（仅参考，CORE 须原创）
├── video/                    # 后续视频升级（本批为空）
├── models/                   # CORE 原创模型（待生产）
├── audio/                    # 预留
├── fonts/                    # Rajdhani / Inter（woff2 + ttf）+ OFL 许可证
└── permissions/
    └── CDPR_Fan_Content_Guidelines_2020-12-10.pdf   # 官方粉丝内容指南证据
```

---

## 2. 推荐候选（首批核心材料）

| 区块 | 推荐候选 | 备选 | 说明 |
|---|---|---|---|
| **CITY** 街道主视觉 | `CITY_01_rain-street.jpg` (3313×2071) | `CITY_02_car-street-4k.jpg` (3840×2160)；`CITY_03_neon-night-drive.jpg` (1920×1080) | 人眼高度、一点透视、无 HUD；CITY_01 冷青雨夜最贴合 |
| **V**（女 V） | `CHARACTER_01_V_a_origami.jpg` (2560×1600) | `CHARACTER_01_V_b_ultimate.jpg` (5120×2880) | 均为红发侧剃形象，相互一致；冷青色调；右下角含官方 logo |
| **WELLES**（Jackie） | `CHARACTER_02_WELLES_a_yellow.jpg` (1920×1080) | `CHARACTER_02_WELLES_b_eating.jpg` (2000×1000) | 已核对人物确为 Jackie；一正式一生活，互补 |
| **DAVID** | `CHARACTER_03_DAVID_a_early.jpg` (1913×1080) | `CHARACTER_03_DAVID_b_late.jpg` (1400×700) | 保留动画画风；冷静 → 义体失控递进 |
| **LUCY** | `CHARACTER_04_LUCY_a_moon.jpg` (1192×673) | `CHARACTER_04_LUCY_b_yellow-string.jpg` (3840×2160) | 月球结尾（剧透）+ 月亮意象 key visual |
| **CORE** 神经主干 | 需**原创**（见 `generation-briefs.md`） | — | `images/core/` 三张仅作参考，不直接使用 |
| **FONTS** | Rajdhani 500/600/700、Inter 400/500 | — | woff2 用于网页，ttf 兜底；OFL 许可 |

人物简短故事依据（官方口径，已写入 manifest 的 story_summary）：
- **V**：追逐夜之城传奇的雇佣兵；Konpeki Plaza 劫案后脑中的 Relic 原型芯片正用
  Johnny Silverhand 的意识体逐步覆盖她，新任务是不计代价活下去。
- **Jackie Welles**：Heywood 本地人、V 最好的朋友，热心肠、忠诚；在 Konpeki Plaza
  劫案中重伤身亡，他的死是整个故事的催化剂。
- **David Martinez**：街头少年，家庭悲剧后植入军用级 Sandevistan，在夜之城地下世界
  把义体推过一切极限，最终被这一追求吞噬。
- **Lucy**：神秘的网络入侵者（netrunner），梦想登上月球；她爱 David 并在他死后活下来，
  登月之梦比城市和城中人更长久。

---

## 3. 许可状态总览（重点）

> 关键原则：**"公开展示"与"公开仓库再分发"是两件事**，以下分别标注。

| 素材类别 | 公开展示 | 公开仓库再分发 | 依据 |
|---|---|---|---|
| **字体** Rajdhani / Inter | ✅ 允许 | ✅ 允许（随软件嵌入/分发，保留 OFL，不得单独售卖） | SIL OFL 1.1（`fonts/OFL-*.txt`） |
| **游戏画面**（街道、女 V、Jackie） | ⚠️ 条件允许 | ⚠️ 条件允许（原始截图再分发未被明确授权，按粉丝条款处理） | CDPR《Fan Content Guidelines》 |
| **动画画面**（David、Lucy） | ⚠️ 条件允许 | ❓ 未确认（Netflix 发行、TRIGGER 制作，权利未单独授予，建议仓库内不直接分发） | CDPR 为 IP 原作，Netflix/TRIGGER 参与 |
| **CORE 参考图** | ❌ 仅参考 | ❌ 禁止（艺术家/CDPR 版权；CORE 最终须原创） | ArtStation / 官方概念 / 商业页 |

**CDPR 粉丝条款的硬性要求（必须遵守）：**
1. **非商业**、无付费墙（可接受合理捐赠）。
2. 显著位置标注非官方，建议：
   "This is an unofficial fan work and is not approved/endorsed by CD PROJEKT RED"。
3. **域名/仓库名不得包含** CDPR 游戏或公司名、商标（如 `cyberpunk-xxx.com`）。
4. 不使用游戏内版权音乐；视频需开启"关闭版权音乐"。

**实务建议：**
- 字体可安全放入公开仓库并本地托管。
- 游戏/动画图片：最稳妥做法是**展示页使用、但不把原始版权图片提交进公开 Git 仓库**
  （例如将 `images/` 加入 `.gitignore`，仅在部署/展示环境提供），并保留非官方声明。
- 若要在公开仓库分发，建议先就具体用途联系 `legal@cdprojektred.com`，或改用原创/官方明确授权素材。

---

## 4. 缺口与后续批次

- **Lucy 月球结尾高清原图（3824×2118）**：Wallpaperflare 独占且 Cloudflare 拦截，
  本批取得最高清正片帧为 1192×673；需真人手动下载或接受当前分辨率。
- **David 后期 ≥1920**：当前 1400×700，实际屏幕显示基本够用，可人工补高清。
- **部分精确来源 URL**：少数素材仅记录到平台/艺术家级来源，需人工回填（见 manifest）。
- **视频升级**：下一批收集 6–10 s 横屏官方片段，方向见 `generation-briefs.md` 第 3 节。
- **CORE 模型**：按 `generation-briefs.md` 第 1 节原创生产（glb 或 Three.js 程序化）。

---

## 5. 如何查看候选板

直接用浏览器打开 `visual-board/index.html`（图片为相对路径，保持本目录结构即可正常显示）。
候选板按固定顺序展示每个候选的缩略图、尺寸、来源与许可状态，"RECOMMEND" 标记为本批推荐项。

---

## 6. 主要来源

- CDPR 官方粉丝内容指南：https://cdn-l.cdprojektred.com/CDPR_Fan_Content_Guidelines_2020-12-10.pdf
- Cyberpunk 2077 官方（人物描述）：https://www.cyberpunk.net/us/en/cyberpunk-2077
- Cyberpunk: Edgerunners 官方：https://www.cyberpunk.net/en/edgerunners
- CDPR Press Center：https://press.cdprojektred.com/
- Rajdhani 字体：https://fonts.google.com/specimen/Rajdhani（OFL）
- Inter 字体：https://fonts.google.com/specimen/Inter（OFL）
- Furio Tedeschi 官方作品集（CORE 参考）：https://www.furiotedeschi.com/cyberpunk-2077

> 注：壁纸聚合站（AlphaCoders、Wallpapercg、UHDpaper 等）与 Bilibili 上的游戏/动画截图
> 版权归原权利方；已在 manifest 逐项标注来源与使用条件，部署前请按第 3 节核对。
