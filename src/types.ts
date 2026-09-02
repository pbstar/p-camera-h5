/** 摄像头朝向 */
export type FacingMode = "user" | "environment";

/** 摄像头分辨率预设 */
export type Resolution = "480p" | "720p" | "1080p";

/** 文字水印配置 */
export interface WatermarkText {
  /** 文字内容；传函数时每帧求值（可用于时间等动态水印） */
  content: string | (() => string);
  /** 字体颜色，默认 rgba(255, 255, 255, 0.5) */
  color?: string;
  /** 字号（px），默认 18 */
  fontSize?: number;
}

/** 图片水印配置 */
export interface WatermarkImage {
  /** 图片 URL */
  url: string;
  /** 图片宽度（px），默认 100 */
  width?: number;
  /** 图片高度（px），默认 100 */
  height?: number;
}

/** 单条水印配置：`x`/`y` 定位，内容 `text` 与 `img` 二选一 */
export interface Watermark {
  /** 水印 x 坐标（px），默认 10 */
  x?: number;
  /** 水印 y 坐标（px），默认 28 */
  y?: number;
  /** 文字水印配置 */
  text?: WatermarkText;
  /** 图片水印配置 */
  img?: WatermarkImage;
}

/** 相机配置 */
export interface CameraOptions {
  /** 挂载容器元素（必填） */
  el: HTMLElement;
  /** 摄像头朝向，默认 "environment"（后置） */
  facingMode?: FacingMode;
  /** 摄像头分辨率预设，默认 "720p"（设备不支持时自动降级） */
  resolution?: Resolution;
  /** 是否录制音频，默认 false */
  isAudio?: boolean;
  /** 是否镜像反转画面，默认 false */
  isMirror?: boolean;
  /** 水印配置数组，默认 null（不添加水印） */
  watermark?: Watermark[] | null;
}

/** 解析后、带默认值的完整配置 */
export interface ResolvedOptions {
  el: HTMLElement;
  facingMode: FacingMode;
  resolution: Resolution;
  isAudio: boolean;
  isMirror: boolean;
  watermark: Watermark[] | null;
}

/** 拍照参数 */
export interface CaptureOptions {
  /** 图片格式，默认 "image/jpeg" */
  type?: "image/jpeg" | "image/png";
}

/** 相机控制器，由 createCamera 返回 */
export interface CameraController {
  /** 拍照，返回图片文件 */
  capture(options?: CaptureOptions): Promise<File>;
  /** 开始录像 */
  startRecording(): Promise<void>;
  /** 停止录像，返回视频文件 */
  stopRecording(): Promise<File>;
  /** 暂停录像 */
  pauseRecording(): void;
  /** 恢复录像 */
  resumeRecording(): void;
  /** 是否正在录像（含暂停状态） */
  isRecording(): boolean;
  /** 切换前后摄像头 */
  switchFacing(): Promise<void>;
  /** 销毁实例，释放摄像头与画布资源 */
  destroy(): void;
}
