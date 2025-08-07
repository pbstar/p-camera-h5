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
  isMirror?: boolean;
  watermark?: Watermark[] | null;
};

export type Media = {
  width?: number;
  height?: number;
  dpr?: number;
  video?: HTMLVideoElement | null;
  canvas?: HTMLCanvasElement | null;
  mediaStream?: MediaStream | null;
  canvasCtx?: CanvasRenderingContext2D;
  canvasStream?: MediaStream | null;
  animationFrameId?: number | null;
  processedVideo?: HTMLVideoElement | null;
};

export type Record = {
  recorder?: MediaRecorder | null;
  chunks?: Blob[];
};
