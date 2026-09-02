# p-camera-h5 📷

轻量级 H5 相机插件，基于 `getUserMedia` 与 `MediaRecorder` 实现，支持拍照、录像、文字与图片水印，适配现代桌面端与移动端浏览器。

## 特性

- **拍照**：`capture()` 输出 JPEG（可切 PNG）
- **录像**：`startRecording()` / `stopRecording()`，支持暂停/恢复与状态查询，自动按浏览器能力选择 `mp4` / `webm` 格式
- **切换摄像头**：`switchFacing()` 运行时切换前后摄，录像不中断
- **水印**：支持文字（内容、位置、颜色、字号，支持每帧求值的动态时间水印）与图片水印
- **分辨率**：`resolution` 预设 `480p` / `720p` / `1080p`，设备不支持时自动降级
- **镜像**：`isMirror` 前置摄像头画面反转
- **音频**：`isAudio` 开启麦克风录制
- **类型安全**：原生 TypeScript 类型声明，构建时自动生成
- **零运行时依赖**

## 安装

### npm

```bash
npm install p-camera-h5
```

```javascript
import { createCamera } from "p-camera-h5";
// 或使用默认导出
import createCamera from "p-camera-h5";
```

### CDN

```html
<script src="https://unpkg.com/p-camera-h5@latest/lib/p-camera-h5.umd.js"></script>
<script>
  pCameraH5.createCamera({ el: document.getElementById("el") });
</script>
```

> UMD 构建的全局变量名为 `pCameraH5`。

## 快速开始

```html
<div id="el" style="width: 300px; height: 500px"></div>
```

```javascript
import { createCamera } from "p-camera-h5";

const camera = await createCamera({
  el: document.getElementById("el"),
  facingMode: "environment", // 后置摄像头
  resolution: "720p",
  isMirror: false,
  isAudio: false,
  watermark: [
    { x: 10, y: 28, text: { content: "p-camera-h5" } },
    // 动态时间水印：content 传函数，每帧求值
    { x: 10, y: 58, text: { content: () => new Date().toLocaleString(), color: "#fff", fontSize: 20 } },
  ],
});

// 拍照（默认 JPEG，可指定 PNG）
const photo = await camera.capture();
const png = await camera.capture({ type: "image/png" });

// 录像
await camera.startRecording();
camera.pauseRecording();
camera.resumeRecording();
camera.isRecording(); // => true
const video = await camera.stopRecording();

// 切换前后摄像头（录像中也可调用，画面切换且录像不中断）
await camera.switchFacing();

// 销毁
camera.destroy();
```

## 配置项

`createCamera(options)` 接收以下配置项：

| 参数         | 类型          | 默认值        | 说明                                      |
| ------------ | ------------- | ------------- | ----------------------------------------- |
| `el`         | `HTMLElement` | 必填          | 挂载容器元素                              |
| `facingMode` | `string`      | `environment` | 摄像头方向：`user`（前置）/ `environment`（后置） |
| `resolution` | `string`      | `720p`        | 分辨率预设：`480p` / `720p` / `1080p`，设备不支持时自动降级 |
| `isAudio`    | `boolean`     | `false`       | 是否开启麦克风录制                        |
| `isMirror`   | `boolean`     | `false`       | 是否镜像反转画面（前置摄像头常用）        |
| `watermark`  | `Watermark[]` | `null`        | 水印配置数组，详见下方说明                |

### 水印配置

每条水印用 `x`/`y` 定位，`text` 与 `img` 二选一（均为对象）：

| 参数   | 类型             | 默认值 | 说明      |
| ------ | ---------------- | ------ | --------- |
| `x`    | `number`         | `10`   | 水印 x 坐标（px） |
| `y`    | `number`         | `28`   | 水印 y 坐标（px） |
| `text` | `WatermarkText`  | -      | 文字水印  |
| `img`  | `WatermarkImage` | -      | 图片水印  |

文字水印 `WatermarkText`：

| 参数       | 类型                        | 默认值                     | 说明                                           |
| ---------- | --------------------------- | -------------------------- | ---------------------------------------------- |
| `content`  | `string` \| `() => string`  | 必填                       | 文字内容；传函数时每帧求值，适合时间等动态水印 |
| `color`    | `string`                    | `rgba(255, 255, 255, 0.5)` | 字体颜色                                       |
| `fontSize` | `number`                    | `18`                       | 字号（px）                                     |

图片水印 `WatermarkImage`：

| 参数     | 类型     | 默认值 | 说明          |
| -------- | -------- | ------ | ------------- |
| `url`    | `string` | 必填   | 图片 URL      |
| `width`  | `number` | `100`  | 图片宽度（px）|
| `height` | `number` | `100`  | 图片高度（px）|

```javascript
watermark: [
  // 文字水印
  { x: 10, y: 28, text: { content: "p-camera-h5" } },
  // 动态时间水印：content 传函数，每帧求值
  { x: 10, y: 58, text: { content: () => new Date().toLocaleString(), color: "#fff", fontSize: 20 } },
  // 图片水印
  { x: 10, y: 88, img: { url: "https://example.com/logo.png", width: 120, height: 40 } },
]
```

> 图片水印需服务端允许跨域（CORS），单张加载失败仅告警跳过，不影响相机初始化。

## 控制器方法

`createCamera` 返回控制器对象，提供以下方法：

| 方法                          | 说明                           | 返回值           |
| ----------------------------- | ------------------------------ | ---------------- |
| `capture(options?)`           | 拍照，可指定图片格式           | `Promise<File>`  |
| `startRecording()`            | 开始录像                       | `Promise<void>`  |
| `stopRecording()`             | 停止录像                       | `Promise<File>`  |
| `pauseRecording()`            | 暂停录像                       | `void`           |
| `resumeRecording()`           | 恢复录像                       | `void`           |
| `isRecording()`               | 是否正在录像（暂停中也算）     | `boolean`        |
| `switchFacing()`              | 切换前后摄像头，录像不中断     | `Promise<void>`  |
| `destroy()`                   | 销毁实例，释放资源             | `void`           |

`capture` 参数：

| 参数   | 类型                           | 默认值       | 说明    |
| ------ | ------------------------------ | ------------ | ------- |
| `type` | `"image/jpeg"` / `"image/png"` | `image/jpeg` | 图片格式 |

所有 Promise 方法在相机未就绪或已销毁时会 reject，调用方需捕获错误。

## 重要说明

1. **安全协议**：需在 HTTPS 或 `localhost` 环境运行（浏览器安全策略要求）。
2. **权限管理**：首次使用需用户授权摄像头 / 麦克风权限；拒绝授权时 `createCamera` 会 reject。
3. **录像格式**：`stopRecording()` 返回的 `File` 扩展名与 MIME 一致——Safari 等支持 `mp4` 的浏览器输出 `mp4`，其余输出 `webm`。
4. **切换摄像头**：`switchFacing()` 需设备存在两个摄像头；设备只有一个时（或目标朝向不可用）会 reject，当前画面不受影响。
5. **销毁后重建**：`destroy()` 会清空容器内容；需再次使用时请重新调用 `createCamera`。

## 从 v2 迁移

v3 相对 v2 的主要变更：

- API 由类实例 `new pCameraH5()` 改为工厂函数 `createCamera()`，返回 `Promise`。
- 移除内置按钮与默认水印，容器只渲染视频层。
- 水印配置统一为对象形式：定位（`x`/`y`）在外层，内容与样式收进 `text`/`img` 对象，不再支持字符串简写。
- 错误处理由 `console.error` 改为 reject / throw，便于调用方捕获。
- 拍照默认输出 JPEG（v2 为 PNG），需要 PNG 时传 `{ type: "image/png" }`。
- 录像文件扩展名与真实 MIME 对齐，不再将 `webm` 内容命名为 `mp4`。
- 移除未使用的构建依赖（`rollup-plugin-json`、`rollup-plugin-postcss`）。

## 开发构建

```bash
npm install
npm run build   # 生成 lib 产物与类型声明
npm run dev     # 启动本地示例服务
```

构建产物输出到 `lib/` 目录，已加入 `.gitignore`。
