# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.0.0-beta.1](https://github.com/pbstar/p-camera-h5/compare/v2.0.3...v3.0.0-beta.1) - 2026-08-31

### ⚠ 破坏性变更

- API 彻底重设计：类实例 `new pCameraH5(options)` 改为函数式工厂 `createCamera(options)`，返回 `Promise<CameraController>`
- 参数校验失败由 `console.error` 改为抛出 `Error`
- 拍照 / 录像等方法在相机未就绪或已销毁时由静默失败改为 `reject`
- 移除内置默认文字水印（`watermark` 默认由数组改为 `null`）
- `startRecording()` 返回值由 `Promise<boolean>` 改为 `Promise<void>`
- 移除内置按钮与错误处理 UI 的 DOM 依赖，容器仅渲染视频层

### 修复

- 修复录像输出 webm 内容却以 `.mp4` 命名的问题：按 `MediaRecorder.isTypeSupported` 探测格式，扩展名与真实 MIME 对齐
- 修复图片水印加载失败导致整个相机初始化中断的问题：单张失败仅告警跳过
- 修复镜像模式下水印未随画面反转的坐标错误

### 优化

- 拍照由 `toDataURL` + base64 转 File 改为 `canvas.toBlob`，降低内存占用
- 水印拆分为独立模块，规范化（字符串简写、默认值填充）与绘制逻辑分离
- 移除未使用的构建依赖 `rollup-plugin-json`、`rollup-plugin-postcss`

### 工程化

- TypeScript 声明文件改为构建时从源码自动生成（`tsc -p tsconfig.build.json`）
- `lib` 构建产物改为 git 忽略，发布时通过 build 生成
- UMD 构建补充 `exports: "named"`，全局变量 `pCameraH5` 携带命名导出

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
