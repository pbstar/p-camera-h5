/** 默认摄像头朝向（后置） */
export const DEFAULT_FACING_MODE = "environment";

/** 默认文字水印颜色 */
export const DEFAULT_TEXT_COLOR = "rgba(255, 255, 255, 0.5)";

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
