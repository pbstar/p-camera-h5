export type WatermarkConfig = {
  text: string;
  image?: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  color: string;
  fontSize: string;
  margin?: number;
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
