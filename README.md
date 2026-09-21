# p-camera-h5 📷

轻量级 H5 相机插件，基于 `getUserMedia` 与 `MediaRecorder` 实现，支持拍照、录像、文字与图片水印，适配现代桌面端与移动端浏览器，零运行时依赖。

## 特性

- **拍照**：`capture()` 输出 JPEG
- **录像**：`startRecording()` / `stopRecording()`，支持暂停 / 恢复 / 状态查询，按浏览器能力自动选择 `mp4` 或 `webm`
- **水印**：文字（内容、位置、颜色、字号，支持每帧求值的动态水印）与图片水印，可同时配置多条
- **镜像**：`isMirror` 反转画面（前置摄像头常用）
- **音频**：`isAudio` 同步录制麦克风
- **类型安全**：原生 TypeScript 类型声明，构建时自动生成

## 安装

### npm

```bash
npm install p-camera-h5
```

```javascript
import { createCamera } from "p-camera-h5";
// 也提供默认导出
import createCamera from "p-camera-h5";
```

### CDN

```html
<script src="https://unpkg.com/p-camera-h5@latest/lib/p-camera-h5.umd.js"></script>
```

```javascript
// UMD 构建的全局变量名为 pCameraH5，用法与 ESM 一致
pCameraH5.createCamera({ el: document.getElementById("el") });
```

## 快速开始

容器需具有有效宽高；插件只渲染视频层，按钮等交互 UI 由业务自行实现。

```html
<div id="el" style="width: 300px; height: 500px"></div>
```

```javascript
import { createCamera } from "p-camera-h5";

const camera = await createCamera({
  el: document.getElementById("el"),
  facingMode: "environment", // 后置摄像头
  isMirror: false,
  isAudio: false,
  watermark: [
    { x: 10, y: 10, text: { content: "p-camera-h5" } },
    // 动态时间水印：content 传函数，每帧求值
    {
      x: 10,
      y: 40,
      text: {
        content: () => new Date().toLocaleString(),
        color: "#fff",
        fontSize: 20,
      },
    },
  ],
});

// 拍照（JPEG）
const photo = await camera.capture();

// 录像
await camera.startRecording();
camera.pauseRecording();
camera.resumeRecording();
camera.isRecording(); // => true
const video = await camera.stopRecording();

// 销毁，释放摄像头与画布资源
camera.destroy();
```

初始化失败（权限被拒、容器宽高为 0、非 HTTPS 环境等）会 reject，建议捕获：

```javascript
createCamera({ el: document.getElementById("el") }).catch((err) => {
  console.error(err.message); // 已转为可读提示，容器内也会同步展示
});
```

## 配置项

`createCamera(options)` 返回 `Promise<CameraController>`。

| 参数         | 类型          | 默认值        | 说明                                              |
| ------------ | ------------- | ------------- | ------------------------------------------------- |
| `el`         | `HTMLElement` | 必填          | 挂载容器元素                                      |
| `facingMode` | `FacingMode`  | `environment` | 摄像头朝向：`user`（前置）/ `environment`（后置） |
| `isAudio`    | `boolean`     | `false`       | 是否同时录制麦克风                                |
| `isMirror`   | `boolean`     | `false`       | 是否镜像反转画面                                  |
| `watermark`  | `Watermark[]` | `null`        | 水印配置数组，传 `null` 表示不添加水印            |

### 水印配置

每条水印用 `x` / `y` 定位，内容 `text` 与 `img` 二选一（同时配置时只渲染 `text` 并告警）：

| 参数   | 类型             | 默认值 | 说明              |
| ------ | ---------------- | ------ | ----------------- |
| `x`    | `number`         | `10`   | 水印 x 坐标（px） |
| `y`    | `number`         | `10`   | 水印 y 坐标（px） |
| `text` | `WatermarkText`  | -      | 文字水印配置      |
| `img`  | `WatermarkImage` | -      | 图片水印配置      |

> `x` / `y` 均为水印**左上角**坐标，文字与图片语义一致。

文字水印 `WatermarkText`：

| 参数       | 类型                       | 默认值                     | 说明                       |
| ---------- | -------------------------- | -------------------------- | -------------------------- |
| `content`  | `string` \| `() => string` | 必填                       | 文字内容；传函数时每帧求值 |
| `color`    | `string`                   | `rgba(255, 255, 255, 0.5)` | 字体颜色                   |
| `fontSize` | `number`                   | `18`                       | 字号（px）                 |

图片水印 `WatermarkImage`：

| 参数     | 类型     | 默认值 | 说明           |
| -------- | -------- | ------ | -------------- |
| `url`    | `string` | 必填   | 图片 URL       |
| `width`  | `number` | `100`  | 图片宽度（px） |
| `height` | `number` | `100`  | 图片高度（px） |

```javascript
watermark: [
  // 文字水印
  { x: 10, y: 10, text: { content: "p-camera-h5" } },
  // 动态时间水印：content 传函数，每帧求值
  {
    x: 10,
    y: 40,
    text: {
      content: () => new Date().toLocaleString(),
      color: "#fff",
      fontSize: 20,
    },
  },
  // 图片水印
  {
    x: 10,
    y: 70,
    img: { url: "https://example.com/logo.png", width: 120, height: 40 },
  },
];
```

- `fontSize` / `width` / `height` 仅接受正数，非正数或带单位字符串（如 `"18px"`）会回退默认值。
- 图片水印需服务端允许跨域（CORS）；单张图片加载失败仅告警跳过，不影响相机初始化。

## 控制器方法

`createCamera()` resolve 出的控制器对象提供以下方法：

| 方法                | 说明                       | 返回值          |
| ------------------- | -------------------------- | --------------- |
| `capture()`         | 拍照，输出 JPEG            | `Promise<File>` |
| `startRecording()`  | 开始录像                   | `Promise<void>` |
| `stopRecording()`   | 停止录像                   | `Promise<File>` |
| `pauseRecording()`  | 暂停录像                   | `void`          |
| `resumeRecording()` | 恢复录像                   | `void`          |
| `isRecording()`     | 是否正在录像（暂停中也算） | `boolean`       |
| `destroy()`         | 销毁实例，释放全部资源     | `void`          |

- Promise 方法在相机未就绪或已销毁时会 reject，调用方需捕获错误。
- `pauseRecording()` / `resumeRecording()` 在未录像时同步 `throw`，重复调用同一状态则幂等无操作。
- 返回的 `File` 文件名为 `pCameraH5-{时间戳}.{扩展名}`，可直接用于 `FormData` 上传。
- `destroy()` 幂等，会停止所有媒体轨道并清空容器内容。

## 重要说明

1. **安全上下文**：需运行在 HTTPS 或 `localhost` 下，否则 `createCamera()` 直接 reject 并给出提示。
2. **权限管理**：首次使用需用户授权摄像头 / 麦克风；拒绝授权时同样 reject。
3. **容器尺寸**：`el` 必须已渲染且 `clientWidth` / `clientHeight` 均不为 0，否则 reject。
4. **画质**：摄像头固定按 720p 申请（`ideal` 软约束，设备不支持时浏览器自动降级），画布按 `devicePixelRatio` 放大，保证拍照与录像清晰度。
5. **录像格式**：`stopRecording()` 返回的文件扩展名与真实 MIME 一致——Safari 等支持 `mp4` 的浏览器输出 `mp4`，其余输出 `webm`。
6. **切换摄像头**：需先 `destroy()`，再以新的 `facingMode` 重新调用 `createCamera()`。
7. **销毁后重建**：`destroy()` 会清空容器内容，需再次使用时请重新调用 `createCamera()`。

## 从 v2 迁移

- `new pCameraH5(options)` 改为 `await createCamera(options)`。
- 水印不再支持字符串简写，内容收进 `text` / `img` 对象，定位 `x` / `y` 留在外层：

  ```javascript
  // v2
  watermark: [{ x: 10, y: 10, text: "p-camera-h5" }];
  // v3
  watermark: [{ x: 10, y: 10, text: { content: "p-camera-h5" } }];
  ```

- 文字水印 `y` 由「文字基线」改为「左上角顶边」，默认值由 `28` 调整为 `10`；原先显式传过 `y` 的配置需减小约一个字号。
- 拍照输出格式由 PNG 改为 JPEG。
- `startRecording()` 由 `Promise<boolean>` 改为 `Promise<void>`，失败不再返回 `false` 而是 reject。
- 失败场景由 `console.error` 静默处理改为 `throw` / `reject`，便于调用方统一捕获。
- 录像文件扩展名与真实格式对齐，不再将 `webm` 内容命名为 `mp4`。
- 移除内置按钮与默认水印，容器只渲染视频层。

## 开发构建

```bash
git clone https://github.com/pbstar/p-camera-h5.git
npm install
npm run build   # 生成 lib 产物与类型声明
npm run dev     # 启动本地示例服务并打开 test/index.html
```

构建产物输出到 `lib/` 目录（已加入 `.gitignore`），发布时由 `prepublishOnly` 自动构建。

---

欢迎通过 [Issues](https://github.com/pbstar/p-camera-h5/issues) 反馈问题或建议。
