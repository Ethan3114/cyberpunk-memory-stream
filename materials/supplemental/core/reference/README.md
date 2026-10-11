# 本地参考网格

来源：Active Theory 已发布网站的第三方存档，提交 `37ceb0fbdeca1f12d129256629b05fab96bcebe1`，文件 `assets/geometry/spine/spine.bin`。

- `spine.bin`：原始数据，仅作为网格数据静态解码，没有执行存档 JavaScript。
- `spine-decoded.json`：同一网格的 positions、normals、UV、index。
- 解码器：npm官方注册表 `draco3d@1.5.7`。前10字节存储以NULL填充的ASCII头长度77，接着是77字节JSON头，再接标准Draco载荷。输出2375顶点、4244三角面。
- 现用于本地第二幕空间验证，不是开源Sandevistan成品。网站使用40份实例并添加本地金属材质和机械附件。

`site/scripts/prepare-assets.mjs` 将现有解码文件复制为发布素材，不依赖运行存档代码。模型核验、候选成品和动效适配说明见项目根目录《动效拆解与第二版改动.md》。
