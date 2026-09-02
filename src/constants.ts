import type { Resolution } from "./types";

/** 默认摄像头朝向（后置） */
export const DEFAULT_FACING_MODE = "environment";

/** 分辨率预设对应的理想宽高（ideal 软约束，设备不支持时浏览器自动降级） */
export const RESOLUTION_PRESETS: Record<Resolution, { width: number; height: number }> = {
  "480p": { width: 640, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
};

/** 默认摄像头分辨率预设 */
export const DEFAULT_RESOLUTION: Resolution = "720p";

/** 默认 JPEG 拍照质量 */
export const DEFAULT_JPEG_QUALITY = 0.92;

/** 默认文字水印颜色 */
export const DEFAULT_TEXT_COLOR = "rgba(255, 255, 255, 0.5)";

/** 默认水印 x 坐标（px） */
export const DEFAULT_WATERMARK_X = 10;

/** 默认水印 y 坐标（px） */
export const DEFAULT_WATERMARK_Y = 28;

/** 默认文字水印字号（px） */
export const DEFAULT_FONT_SIZE = 18;

/** 默认图片水印尺寸（px） */
export const DEFAULT_IMG_SIZE = 100;

/**
 * 容器模板：视频展示层 + 加载中/错误提示层。
 * 使用 class 选择器，避免多实例时 id 冲突。
 */
export const elTemplate = `
  <style>
    .p-camera-h5 {
      width: 100%;
      height: 100%;
      background-color: #000;
      position: relative;
      z-index: 100;
    }
    .p-camera-h5 .p-camera-loading,
    .p-camera-h5 .p-camera-error {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 20% 10%;
      color: #fff;
      background-color: #000;
      line-height: 30px;
      text-align: center;
      font-size: 16px;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 110;
      display: none;
    }
    .p-camera-h5 .p-camera-error {
      z-index: 111;
    }
    .p-camera-h5 .p-camera-video {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 101;
    }
  </style>
  <div class="p-camera-h5">
    <div class="p-camera-loading">加载中...</div>
    <div class="p-camera-error"></div>
    <video class="p-camera-video" autoplay playsinline muted></video>
  </div>
`;
