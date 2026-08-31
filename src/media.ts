import type { ResolvedOptions } from "./types";
import { prepareWatermarks, drawWatermarks, type PreparedWatermark } from "./watermark";

/** 相机运行时状态 */
export interface CameraEngine {
  /** 展示层的 video 元素（播放带水印的处理流） */
  video: HTMLVideoElement;
  /** 隐藏的原始流播放元素 */
  processedVideo: HTMLVideoElement | null;
  canvas: HTMLCanvasElement;
  canvasCtx: CanvasRenderingContext2D;
  /** 摄像头原始媒体流 */
  mediaStream: MediaStream | null;
  /** 带水印的合成画布流 */
  canvasStream: MediaStream | null;
  animationFrameId: number | null;
  width: number;
  height: number;
  dpr: number;
  watermarks: PreparedWatermark[] | null;
}

/** 打开摄像头并初始化画布与处理流 */
export const setupCamera = async (
  config: ResolvedOptions,
  container: HTMLElement
): Promise<CameraEngine> => {
  const video = container.querySelector(
    ".p-camera-video"
  ) as HTMLVideoElement;
  const canvas = document.createElement("canvas");
  const width = container.clientWidth;
  const height = container.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  // 画布按设备像素比放大，保证截图/录像清晰度
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // 获取原始媒体流
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: config.facingMode },
    audio: config.isAudio
      ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : false,
  });

  const canvasCtx = canvas.getContext("2d", {
    alpha: false, // 关闭透明度提升渲染性能
    willReadFrequently: false, // 关闭频繁读取提升渲染性能
  }) as CanvasRenderingContext2D;
  canvasCtx.imageSmoothingEnabled = true;
  canvasCtx.imageSmoothingQuality = "high";

  // 预加载并规范化水印
  const watermarks = await prepareWatermarks(config.watermark);

  const engine: CameraEngine = {
    video,
    processedVideo: null,
    canvas,
    canvasCtx,
    mediaStream,
    canvasStream: null,
    animationFrameId: null,
    width,
    height,
    dpr,
    watermarks,
  };

  // 创建带水印的合成流并展示
  engine.canvasStream = createProcessedStream(engine, config);
  engine.video.srcObject = engine.canvasStream;

  return engine;
};

/** 创建带水印的合成视频流（canvas.captureStream + 音频轨） */
const createProcessedStream = (
  engine: CameraEngine,
  config: ResolvedOptions
): MediaStream => {
  if (!engine.mediaStream) throw new Error("媒体流未初始化");
  const processedStream = engine.canvas.captureStream(30);
  if (config.isAudio) {
    const audioTracks = engine.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) processedStream.addTrack(audioTracks[0]);
  }

  // 隐藏 video 播放原始流，逐帧绘制到画布
  const videoElement = document.createElement("video");
  engine.processedVideo = videoElement;
  videoElement.srcObject = new MediaStream(engine.mediaStream.getVideoTracks());
  videoElement.muted = true; // 必须静音以避免音频回路
  videoElement.playsInline = true;
  videoElement.onloadedmetadata = () => {
    videoElement
      .play()
      .then(() => renderLoop(videoElement, engine, config))
      .catch((err) => console.error(`[p-camera-h5] 视频播放失败: ${err.message}`));
  };

  return processedStream;
};

/** 渲染循环：逐帧绘制视频画面与水印 */
const renderLoop = (
  video: HTMLVideoElement,
  engine: CameraEngine,
  config: ResolvedOptions
): void => {
  const draw = () => {
    drawFrame(video, engine, config);
    engine.animationFrameId = requestAnimationFrame(draw);
  };
  draw();
};

/** 绘制单帧 */
const drawFrame = (
  video: HTMLVideoElement,
  engine: CameraEngine,
  config: ResolvedOptions
): void => {
  const { canvasCtx, width, height, dpr, watermarks } = engine;
  const cw = width * dpr;
  const ch = height * dpr;

  // 等比缩放填满画布（居中裁剪）
  const scale = Math.max(cw / video.videoWidth, ch / video.videoHeight);
  const drawWidth = video.videoWidth * scale;
  const drawHeight = video.videoHeight * scale;
  const offsetX = (cw - drawWidth) / 2;
  const offsetY = (ch - drawHeight) / 2;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, cw, ch);
  if (config.isMirror) {
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(video, -offsetX - drawWidth, offsetY, drawWidth, drawHeight);
  } else {
    canvasCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
  }
  canvasCtx.restore();

  drawWatermarks(canvasCtx, watermarks, dpr);
};

/** 释放相机引擎占用的全部资源 */
export const destroyCamera = (engine: CameraEngine): void => {
  if (engine.animationFrameId != null) {
    cancelAnimationFrame(engine.animationFrameId);
    engine.animationFrameId = null;
  }
  engine.mediaStream?.getTracks().forEach((track) => track.stop());
  engine.canvasStream?.getTracks().forEach((track) => track.stop());
  if (engine.processedVideo) {
    engine.processedVideo.srcObject = null;
    engine.processedVideo = null;
  }
  engine.video.srcObject = null;
  engine.mediaStream = null;
  engine.canvasStream = null;
};
