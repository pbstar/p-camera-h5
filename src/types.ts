type WatermarkText = {
  text?: string;
  color?: string;
  fontSize?: string;
};
type WatermarkImage = {
  url?: string;
  width?: number;
  height?: number;
};
type WatermarkConfig = {
  visible?: boolean;
  x?: number;
  y?: number;
  text?: WatermarkText;
  image?: WatermarkImage;
};

export type CameraOptions = {
  el: HTMLElement | null;
  style?: string;
  watermark?: WatermarkConfig;
};

export type Media = {
  mediaStream?: MediaStream;
  mediaRecorder?: MediaRecorder;
  recordedChunks?: Blob[];
  recordTimer?: number;
  recordTime?: HTMLElement | null;
  canvasCtx?: CanvasRenderingContext2D;
  canvasStream?: MediaStream;
  animationFrameId?: number;
  video?: HTMLVideoElement | null;
  isWatermarkVisible?: boolean;
};

export type Btns = {
  watermarkBtn?: HTMLElement | null;
  captureBtn?: HTMLElement | null;
  recordBtn?: HTMLElement | null;
};
