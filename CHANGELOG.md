# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.0.0-beta.1](https://github.com/pbstar/p-camera-h5/compare/v2.0.3...v3.0.0-beta.1) - 2026-09-12

### ⚠ 破坏性变更

- API 由类实例 `new pCameraH5(options)` 重构为工厂函数 `createCamera(options)`，返回 `Promise<CameraController>`
- 容器只渲染视频层，移除内置按钮与默认水印
- 水印配置统一为对象形式：定位（`x`/`y`）在外层，内容收进 `text` / `img` 对象
- 拍照输出格式由 PNG 改为 JPEG
- 参数校验失败与方法未就绪/已销毁场景由静默失败改为 `throw` / `reject`
- `startRecording()` 返回值由 `Promise<boolean>` 改为 `Promise<void>`

### 新增

- 录像控制：`pauseRecording()` / `resumeRecording()` / `isRecording()`
- `switchFacing()` 运行时切换前后摄像头，录像不中断
- 文字水印 `text.content` 支持传函数，每帧求值，可用于时间等动态水印

### 修复

- 修复 CJS 入口损坏：`require` 条件指向 `.cjs` 产物，避免 UMD 被当作 ESM 解析
- 修复销毁时若有 `stopRecording()` 尚在等待会永久挂起，改为 reject
- 修复录像 `webm` 内容以 `.mp4` 命名的问题：按 `MediaRecorder.isTypeSupported` 探测格式
- 修复图片水印加载失败导致整个相机初始化中断：单张失败仅告警跳过

### 优化

- 拍照由 `toDataURL` + base64 转 File 改为 `canvas.toBlob`，降低内存占用
- 水印拆分为独立模块，规范化与绘制逻辑分离
- TypeScript 声明文件改为构建时从源码自动生成
- `lib` 构建产物改为 git 忽略，发布时通过 build 生成
- 移除未使用的构建依赖（`rollup-plugin-json`、`rollup-plugin-postcss`）

## [2.0.3](https://github.com/pbstar/p-camera-h5/compare/v2.0.2...v2.0.3) - 2025-08-30

### 优化

- 优化音频处理配置
- 为视频元素添加静音属性，规避音频回路
- 设置静音播放，无需用户主动交互即可自动播放

## [2.0.2](https://github.com/pbstar/p-camera-h5/compare/v2.0.1...v2.0.2) - 2025-08-28

### 修复

- 修复部分浏览器安全策略无法自动播放视频流的问题

## [2.0.1](https://github.com/pbstar/p-camera-h5/compare/v2.0.0...v2.0.1) - 2025-08-17

### 优化

- 优化开始录像与销毁方法

## [2.0.0](https://github.com/pbstar/p-camera-h5/compare/v1.0.1...v2.0.0) - 2025-08-02

### ⚠ 破坏性变更

- 重构项目：移除内置按钮，简化 API 方法，丰富水印配置

### 新增

- 完善销毁逻辑

## [1.0.1](https://github.com/pbstar/p-camera-h5/compare/v1.0.0...v1.0.1) - 2025-07-31

### 修复

- 修复重复初始化后无法销毁的问题

## [1.0.0](https://github.com/pbstar/p-camera-h5/compare/v1.0.0-beta.4...v1.0.0) - 2025-05-19

首个正式版本。

## [1.0.0-beta.4](https://github.com/pbstar/p-camera-h5/compare/v1.0.0-beta.3...v1.0.0-beta.4) - 2025-02-25

### 新增

- 添加 `isAudio` 配置，支持关闭录音仅录像

### 优化

- 优化视频清晰度与视频绘制
- 优化视频水印清晰度

## [1.0.0-beta.3](https://github.com/pbstar/p-camera-h5/compare/v1.0.0-beta.2...v1.0.0-beta.3) - 2025-02-23

### 新增

- 添加 `facingMode` 摄像头方向选择配置
- 添加错误提示 UI

### 修复

- 修复错误显示与苹果手机兼容 bug

## [1.0.0-beta.2](https://github.com/pbstar/p-camera-h5/compare/v1.0.0-beta.1...v1.0.0-beta.2) - 2025-02-23

### 新增

- 扩展水印功能，支持图片水印

## [1.0.0-beta.1](https://github.com/pbstar/p-camera-h5/releases/tag/v1.0.0-beta.1) - 2025-02-22

首个测试版本。
