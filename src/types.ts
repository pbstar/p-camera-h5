/** 摄像头朝向 */
export type FacingMode = "user" | "environment";

/** 文字水印配置 */
export interface WatermarkText {
  /** 文字内容 */
  text: string;
  /** 字体颜色 */
  color?: string;
  /** 字体大小（px） */
  fontSize?: number;
}

/** 图片水印配置 */
export interface WatermarkImage {
  /** 图片 URL */
  url: string;
  /** 图片宽度（px） */
  width?: number;
  /** 图片高度（px） */
  height?: number;
}

/** 水印配置，`text` 与 `img` 二选一 */
export interface Watermark {
  /** 水印 x 坐标（px） */
  x?: number;
  /** 水印 y 坐标（px） */
  y?: number;
  /** 文字水印：字符串或配置对象 */
  text?: WatermarkText | string;
  /** 图片水印：URL 字符串或配置对象 */
  img?: WatermarkImage | string;
}

/** 相机配置 */
export interface CameraOptions {
  /** 挂载容器元素（必填） */
  el: HTMLElement;
  /** 摄像头朝向，默认 "environment"（后置） */
  facingMode?: FacingMode;
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
  isAudio: boolean;
  isMirror: boolean;
  watermark: Watermark[] | null;
}

/** 相机控制器，由 createCamera 返回 */
export interface CameraController {
  /** 拍照，返回 PNG 图片文件 */
  capture(): Promise<File>;
  /** 开始录像 */
  startRecording(): Promise<void>;
  /** 停止录像，返回视频文件 */
  stopRecording(): Promise<File>;
  /** 销毁实例，释放摄像头与画布资源 */
  destroy(): void;
}
