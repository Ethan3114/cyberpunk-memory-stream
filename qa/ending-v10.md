# 第十版：结尾脊椎遮挡与发布

2026-10-11。此前只排除位于脊椎几何体内的点；体积外的前景气泡仍可投影到脊椎上。强烈的屏幕粒子反射又使表面像是混入点云，造成结尾依然穿模的观感。

## 修正

- 使用实际模型顶点得到脊椎高度 −18.733078 至 8.035464、径向范围 .98840049。保留原体积避让半径 1.13840049。
- 对镜头到每个粒子的射线与保护圆柱求交；粒子在脊椎前方且投影落入保护范围时，在结尾移除。progress .90–.97 用稳定粒子种子渐进启用，最终强度 1；不移动原点云或改变已确认角色轨迹。
- 脊椎及附加金属件的屏幕粒子反射由 .85 随结尾降低至 .22，保留金属反射并让实际形状清晰。其他角色近景不改变。
- 保留四屏玻璃体积、视频窗口避让及绕轴展开。

## 本地验收

`particles-v10/ending-check.json`：progress=1，前景脊椎保护实际排除 9796 点；体积内排除 11246 点，玻璃体积排除 1792 点，媒体前景排除 6488 点；4 屏启用。屏幕/脊椎最小几何间距 .41659951 世界单位。

`particles-v10/ending.png`：实际 CSS 1072×670 截图，中央脊椎轮廓清晰；贴图和玻璃折射仍保留。该保护使用保守圆柱轮廓，不是逐三角形的真实深度遮挡算法。

`particles-v10/production-check.json`：正式 `/cyberpunk/` 子路径原生 End 至 progress=1，最小间距 .41659951；点击 REPLAY 至 progress=0，scene-02 恢复播放；错误日志为空。

TypeScript / Vite 构建通过；JS 1,025.18 kB，gzip 268.07 kB；单包 >500 kB 提示保留。

## 发布状态

公开仓库已创建：[Ethan3114/cyberpunk-memory-stream](https://github.com/Ethan3114/cyberpunk-memory-stream)。GitHub Pages 已成功发布：[线上体验](https://ethan3114.github.io/cyberpunk-memory-stream/)。首次运行 [38122805228](https://github.com/Ethan3114/cyberpunk-memory-stream/actions/runs/38122805228) 为 Success，build 17 秒、deploy 20 秒，总计 44 秒；部署代码提交 `21eb8f1bcb3559d4bd16185564fd5fc6a383882e`。

`particles-v10/upload-hash-check.json`：公开仓库的 38 个运行素材 SHA256 全部与本地一致。

`particles-v10/public-check.json`：公网实际 CSS 1440×900、DPR 1；开场 scene-02 视频实际播放，原生 PageDown 后 progress .0752、相机和字标下降 .4951；角色 Jackie 视频实际播放；音乐 readyState=4、paused=false、无媒体错误；原生 End 至 progress=1、屏幕/脊椎最小间距 .41659951；REPLAY 回到 0，scene-02 恢复播放，音乐检查后已关闭。浏览器错误日志为空。

`particles-v10/public-ending.png` 是公网实际结尾截图；截图前后 progress 均为 1，视口均为 1440×900。没有通过开发锚点在生产站伪造结尾。

正式仓库子路径构建 `VITE_BASE_PATH=/cyberpunk-memory-stream/` 已验证，JS 1,025.19 kB、gzip 268.08 kB。未做跨设备帧率基准。
