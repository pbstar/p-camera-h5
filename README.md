# p-camera-h5 📷

[![GitHub License](https://img.shields.io/github/license/pbstar/p-camera-h5?style=flat&color=109BCD)](https://github.com/pbstar/p-camera-h5)
[![NPM Version](https://img.shields.io/npm/v/p-camera-h5?style=flat&color=d4b106)](https://www.npmjs.com/package/p-camera-h5)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/p-camera-h5?style=flat&color=41B883)](https://bundlephobia.com/package/p-camera-h5)
[![Demo](https://img.shields.io/badge/在线示例-FF5722?style=flat)](https://pbstar.github.io/p-camera-h5-demo/)

一款轻量级 H5 相机插件，支持拍照、录像、动态水印与高度样式定制化，适配现代浏览器，为 Web 应用提供原生级摄像头体验。

---

## ✨ 核心特性

- **即时捕获**  
  📸 拍照（PNG 格式） | 🎥 录像（WEBM 格式，最长 60 秒）
- **动态水印**  
  🖼️ 支持文字内容、位置、颜色、字体大小灵活配置
- **无缝集成**  
  ⚡ 极简 API 设计 | 🔧 CSS 样式与交互行为全定制
- **跨平台**  
  🌍 完整适配桌面端与移动端浏览器

---

## 📦 安装

### NPM

```bash
npm install p-camera-h5 --save
```

### CDN

```html
<script src="https://unpkg.com/p-camera-h5@latest/dist/p-camera-h5.umd.js"></script>
```

---

## 🚀 快速接入

```html
<div id="camera-container" style="width: 300px; height: 500px"></div>
```

```javascript
import pCameraH5 from "p-camera-h5";

const camera = new pCameraH5({
  el: document.getElementById("camera-container"),
  watermark: {
    text: "Powered by pCameraH5",
    position: "bottom-left",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "16px",
  },
});

// 事件监听
camera.on("capture", (file) => {
  console.log("📷 照片已捕获:", file);
  camera.downloadFile(file, "photo.png"); // 自动下载
});

camera.on("record", (file) => {
  console.log("🎥 视频已生成:", file);
  camera.downloadFile(file, "video.mp4");
});
```

---

## ⚙️ 配置项

| 参数        | 类型        | 默认值                                                                                             | 说明                  |
| ----------- | ----------- | -------------------------------------------------------------------------------------------------- | --------------------- |
| `el`        | HTMLElement | **必填**                                                                                           | 挂载容器元素          |
| `style`     | string      | `""`                                                                                               | 自定义 CSS 样式字符串 |
| `watermark` | object      | `{ text: "pCameraH5", position: "bottom-left", color: "rgba(255,255,255,0.5)", fontSize: "18px" }` | 水印配置对象          |

---

## 📚 API 方法

| 方法               | 说明                 | 示例                        |
| ------------------ | -------------------- | --------------------------- |
| `init()`           | 初始化摄像头         | `camera.init()`             |
| `capture()`        | 拍摄照片             | `camera.capture()`          |
| `startRecording()` | 开始录像             | `camera.startRecording()`   |
| `stopRecording()`  | 停止录像             | `camera.stopRecording()`    |
| `destroy()`        | 销毁实例（释放资源） | `camera.destroy()`          |
| `downloadFile()`   | 下载文件             | `camera.downloadFile(file)` |

---

## 🔌 事件系统

```javascript
// 监听事件
camera.on("capture", handlePhoto);
camera.on("record", handleVideo);

// 移除事件
camera.off("capture", handlePhoto);
```

---

## 📝 样式自定义

dom结构参考

```html
  <div id="p-camera-h5">
    <div id="p-loading">加载中...</div>
    <div id="p-error"></div>
    <div id="p-container">
      <video id="p-video" autoplay playsinline></video>
      <canvas id="p-canvas" style="display:none;"></canvas>
    </div>
    <div id="p-watermark-btn">关闭水印</div>
    <div id="p-capture-btn">拍照</div>
    <div id="p-record-btn">录制</div>
    <div id="p-record-time">00:00</div>
  </div>
```


## 🚨 重要说明

1. **安全协议**  
   需在 HTTPS 环境或 localhost 下运行（浏览器安全策略要求）
2. **权限管理**  
   首次使用需用户授权摄像头和麦克风权限

3. **移动端优化**  
   推荐添加 viewport 元标签以禁用缩放：

   ```html
   <meta
     name="viewport"
     content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
   />
   ```

4. **格式说明**  
   录像实际输出为 WEBM 格式，MP4 下载通过自动转换实现

---

## 🛠️ 开发构建

```bash
git clone https://github.com/pbstar/p-camera-h5.git
npm install
npm run build
```

欢迎通过 [Issues](https://github.com/pbstar/p-camera-h5/issues) 提交建议或贡献代码！🚀
