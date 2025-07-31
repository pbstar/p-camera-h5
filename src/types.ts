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
type Watermark = {
  x?: number;
  y?: number;
  text?: WatermarkText;
  img?: WatermarkImage;
};

export type CameraOptions = {
  el: HTMLElement | null;
  facingMode?: string;
  isAudio?: boolean;
  watermark?: Watermark[] | null;
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
};
