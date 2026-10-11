# 指定背景音乐实际文件

2026-10-10 · 已取得用户指定歌曲的原版音频，可供页面内 HTML audio 接入。

- 曲目：**I Really Want to Stay at Your House**。
- 曲目署名：**Rosa Walton & Hallie Coggins**。
- [Lakeshore Records 官方公开曲目来源](https://www.youtube.com/watch?v=gzbLODUb1sA)，视频 ID `gzbLODUb1sA`。下载元数据确认上传者为 Lakeshore Records，标题明确为该歌曲及上述署名；不是另选翻唱、混音或旧 Dark Things Loop。
- 实际文件：`i-really-want-to-stay-at-your-house.m4a`，**3,994,117 字节**。
- 实际音轨：AAC LC，44,100 Hz，双声道，约 **246.687 秒（4 分 6.7 秒）**，约 128 kbps。仅一条音轨，无视频轨。
- HTML 推荐 MIME：`audio/mp4`。系统 file 对 MP4 容器输出 video/mp4，不表示文件含视频；实际音轨信息由 afinfo 与下载格式元数据交叉检查。
- SHA-256：`fac073d8d0121cc262ed0c3a1153b0535456a96829998d2c933c5701fdff6444`。

以临时 yt-dlp 环境直接取得官方公开上传的 audio-only format 140，无登录、付费、验证码或保护绕过，没有嵌入/隐藏 YouTube 播放器。临时依赖位于 /tmp 缓存，没有全局安装。

验证：afinfo 成功解析参数；使用临时 FFmpeg 完整解码至空输出成功。系统 afconvert 转 WAV 尝试出现 cfmt 格式错误，随后用 FFmpeg 完整解码完成独立校验。没有在用户电脑播放音乐；页面内启停、循环以及浏览器实际播放由开发接入后验证。

`source-metadata.json` 保留来源与格式字段，`validation.json` 保留文件检查结果。未保留已过期风险的临时 CDN 音频 URL。源码接入请复制实际 M4A，不使用 YouTube 页面 URL 作为 audio src，不用示例循环音乐代替本曲。
