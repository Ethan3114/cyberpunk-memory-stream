# 可回退快照

以下 ZIP 为本地源代码存档，运行素材保留在 site/public/assets。

- v10-before-revision.zip：此次改动前的源代码。
- v11-space-baseline.zip：界面精简、减薄玻璃、浮动文字、三段斜向折射切幕与倒置结尾，尚未加入首尾虚无形变。
- v11-final-source.zip：包含首尾方向相反的虚无形变，最终发布代码。

基础版也已保存在 GitHub 提交：
https://github.com/Ethan3114/cyberpunk-memory-stream/commit/843b6b0658a9c37f995861601e206078ea963cca

回退到基础版时，先移走 src/SpaceTimeline.ts，再解压基础 ZIP 覆盖 site/src 并重新构建。也可从上述提交获取完整源码。源码实验发布提交：3d314e7c88a91d139cb4f0b5ac3701f634ac440a。
