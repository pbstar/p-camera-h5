type WatermarkText = {
  text: string;
  color?: string;
  fontSize?: number;
};
type WatermarkImage = {
  url: string;
  el?: HTMLImageElement;
  width?: number;
  height?: number;
};
type Watermark = {
  x?: number;
  y?: number;
  text?: WatermarkText | string;
  img?: WatermarkImage | string;
};

export type CameraOptions = {
  el: HTMLElement | null;
  facingMode?: string;
  isAudio?: boolean;
  watermark?: Watermark[] | null;
};

export type Media = {
  width?: number;
  height?: number;
  dpr?: number;
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
