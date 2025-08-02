# p-camera-h5 📷

[![GitHub License](https://img.shields.io/github/license/pbstar/p-camera-h5?style=flat&color=109BCD)](https://github.com/pbstar/p-camera-h5)
[![NPM Version](https://img.shields.io/npm/v/p-camera-h5?style=flat&color=d4b106)](https://www.npmjs.com/package/p-camera-h5)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/p-camera-h5?style=flat&color=41B883)](https://bundlephobia.com/package/p-camera-h5)
[![Demo](https://img.shields.io/badge/在线示例-FF5722?style=flat)](https://pbstar.github.io/p-camera-h5-demo/)

一款轻量级 H5 相机插件，支持拍照、录像、文字图片水印，适配现代浏览器，为 Web 应用提供原生级摄像头体验。

---

## ✨ 核心特性

- **即时捕获**  
  📸 拍照、🎥 录像
- **水印**  
  🖼️ 支持文字内容、位置、颜色、字体大小、图片等
- **无缝集成**  
  ⚡ 极简 API 设计、不依赖任何外部库
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
<div id="el" style="width: 300px; height: 500px"></div>
```

```javascript
import pCameraH5 from "p-camera-h5";

const camera = new pCameraH5({
  el: document.querySelector("#el"), // 容器选择器
  watermark: [
    {
      x: 10,
      y: 10,
      text: "p-camera-h5",
    },
  ],
});
```

---

## ⚙️ 配置项

| 参数         | 类型        | 默认值        | 说明                                      |
| ------------ | ----------- | ------------- | ----------------------------------------- |
| `el`         | HTMLElement | **必填**      | 挂载容器元素                              |
| `facingMode` | string      | `environment` | 摄像头方向，默认后置，可选 `user`（前置） |
| `isAudio`    | boolean     | `false`       | 是否开启音频录制，默认关闭                |
| `isMirror`   | boolean     | `false`       | 是否镜像反转，默认关闭                    |
| `watermark`  | Watermark[] | null          | 水印配置对象数组                          |

水印配置对象说明：

| 参数   | 类型                      | 默认值 | 说明                       |
| ------ | ------------------------- | ------ | -------------------------- |
| `x`    | number                    | 10     | 水印 x 坐标                |
| `y`    | number                    | 28     | 水印 y 坐标                |
| `text` | WatermarkText{} / string  | -      | 文字水印配置对象或字符串   |
| `img`  | WatermarkImage{} / string | -      | 图片水印配置对象或图片 URL |

文字水印配置对象说明：

| 参数       | 类型   | 默认值                     | 说明         |
| ---------- | ------ | -------------------------- | ------------ |
| `text`     | string | -                          | 文字内容     |
| `fontSize` | number | 18                         | 字体大小(px) |
| `color`    | string | `rgba(255, 255, 255, 0.5)` | 字体颜色     |

图片水印配置对象说明：

| 参数     | 类型   | 默认值 | 说明         |
| -------- | ------ | ------ | ------------ |
| `url`    | string | -      | 图片 URL     |
| `width`  | number | 100    | 图片宽度(px) |
| `height` | number | 100    | 图片高度(px) |

---

## 📚 API 方法

| 方法               | 说明                 | 返回值        | 示例                      |
| ------------------ | -------------------- | ------------- | ------------------------- |
| `capture()`        | 拍摄照片             | Promise<File> | `camera.capture()`        |
| `startRecording()` | 开始录像             | void          | `camera.startRecording()` |
| `stopRecording()`  | 停止录像             | Promise<File> | `camera.stopRecording()`  |
| `destroy()`        | 销毁实例（释放资源） | void          | `camera.destroy()`        |

注意：`capture()` 和 `stopRecording()` 方法返回的是 Promise 对象，需要使用 `await` 或 `.then()` 来获取结果。

---

## 🚨 重要说明

1. **安全协议**  
   需在 HTTPS 环境或 localhost 下运行（浏览器安全策略要求）
2. **权限管理**  
   首次使用需用户授权摄像头和麦克风权限
3. **格式说明**  
   录像实际输出为 WEBM 格式，MP4 下载通过自动转换实现

---

## 🛠️ 开发构建

```bash
git clone https://github.com/pbstar/p-camera-h5.git
npm install
npm run build
```

欢迎通过 [Issues](https://github.com/pbstar/p-camera-h5/issues) 提交建议或贡献代码！🚀
