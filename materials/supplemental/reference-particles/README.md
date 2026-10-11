# 参考粒子数据

- `flower-reference.bin`：65536×xyz Float32位置，紧随65536×rgb Float32颜色；小端，共1,572,864字节。
- 来源：https://activetheory.net/assets/geometry/particles/flower_spine-256.bin
- 使用已安装Three.js的Draco WASM解码器将自定义10字节长度头+JSON头+Draco数据解码；不执行站点应用脚本。
- `particle-matcap.png`来源：https://activetheory.net/assets/images/particle/matcap3.png
- 第六版新增`forest-reference.bin`：同样为65536×xyz后接65536×rgb Float32；来源https://activetheory.net/assets/geometry/particles/forest-256.bin。它用于首屏完整空间点云，实际色彩结合项目霓虹渐变和官方视频，不沿用森林绿色。
- 机制参考：https://activetheory.net/assets/shaders/compiled.vs 的FlowerParticleShader.glsl、SpineShader.glsl。
- 处理：保留原点位置/颜色数据；项目ParticleBanks适配左右布局与坐标尺度。第五版在片元阶段仅读取源颜色亮度，以空间连续的青蓝/紫/洋红/少量金色替换源色相；不沿用绿色。原始文件与解码研究保留于Git忽略的research/active-theory；构建使用此处已解码版本，无须联网。
