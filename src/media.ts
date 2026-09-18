import type { ResolvedOptions, FacingMode } from "./types";
import { CANVAS_STREAM_FPS } from "./constants";
import {
  prepareWatermarks,
  drawWatermarks,
  type PreparedWatermark,
} from "./watermark";

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
  isAudio: boolean;
  isMirror: boolean;
}

/** 打开指定朝向的摄像头流 */
const openStream = async (
  facingMode: FacingMode,
  isAudio: boolean
): Promise<MediaStream> => {
  // 非安全上下文（http 且非 localhost）下浏览器不暴露该 API，提前拦截以给出可读提示
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "[p-camera-h5] 当前环境不支持摄像头访问，请确认运行在 HTTPS 或 localhost 下"
    );
  }
  // 720p（ideal 软约束：设备不支持时浏览器自动降级）
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: isAudio
      ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : false,
  });
};

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
  // 尺寸为 0 时画布与媒体流会静默失效（全黑且无报错），此处直接拦截
  if (width === 0 || height === 0) {
    throw new Error(
      "[p-camera-h5] 容器尺寸为 0，请确认 el 元素已渲染且具有有效宽高"
    );
  }
  const dpr = window.devicePixelRatio || 1;

  // 画布按设备像素比放大，保证截图/录像清晰度
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const mediaStream = await openStream(config.facingMode, config.isAudio);

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
    isAudio: config.isAudio,
    isMirror: config.isMirror,
  };

  startPipeline(engine);
  return engine;
};

/** 搭建合成管线：画布流（含音频轨）接到展示层 video，再逐帧绘制 */
const startPipeline = (engine: CameraEngine): void => {
  if (!engine.mediaStream) throw new Error("[p-camera-h5] 媒体流未初始化");
  const processedStream = engine.canvas.captureStream(CANVAS_STREAM_FPS);
  if (engine.isAudio) {
    const audioTracks = engine.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) processedStream.addTrack(audioTracks[0]);
  }
  engine.canvasStream = processedStream;
  engine.video.srcObject = processedStream;
  startRender(engine);
};

/** 启动逐帧绘制：隐藏 video 播放原始视频轨，绘制到画布 */
const startRender = (engine: CameraEngine): void => {
  if (!engine.mediaStream) return;
  const videoElement = document.createElement("video");
  engine.processedVideo = videoElement;
  videoElement.srcObject = new MediaStream(engine.mediaStream.getVideoTracks());
  videoElement.muted = true; // 必须静音以避免音频回路
  videoElement.playsInline = true;
  videoElement.onloadedmetadata = () => {
    videoElement
      .play()
      .then(() => renderLoop(videoElement, engine))
      .catch((err) => console.error(`[p-camera-h5] 视频播放失败: ${err.message}`));
  };
};

/** 停止逐帧绘制 */
const stopRender = (engine: CameraEngine): void => {
  if (engine.animationFrameId != null) {
    cancelAnimationFrame(engine.animationFrameId);
    engine.animationFrameId = null;
  }
  if (engine.processedVideo) {
    engine.processedVideo.srcObject = null;
    engine.processedVideo = null;
  }
};

/** 渲染循环：逐帧绘制视频画面与水印 */
const renderLoop = (video: HTMLVideoElement, engine: CameraEngine): void => {
  // 画布流按 CANVAS_STREAM_FPS 采样，绘制更快只是白跑帧，故对齐同一帧率
  const frameInterval = 1000 / CANVAS_STREAM_FPS;
  let lastDrawAt = 0;

  const draw = (timestamp: number): void => {
    if (timestamp - lastDrawAt >= frameInterval) {
      lastDrawAt = timestamp;
      try {
        drawFrame(video, engine);
      } catch (err) {
        // 单帧绘制失败不能中断循环，否则画面会永久冻结
        console.warn(`[p-camera-h5] 帧绘制失败，已跳过该帧: ${(err as Error).message}`);
      }
    }
    engine.animationFrameId = requestAnimationFrame(draw);
  };
  engine.animationFrameId = requestAnimationFrame(draw);
};

/** 绘制单帧 */
const drawFrame = (video: HTMLVideoElement, engine: CameraEngine): void => {
  const { canvasCtx, width, height, dpr, watermarks, isMirror } = engine;
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
  if (isMirror) {
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
  stopRender(engine);
  engine.mediaStream?.getTracks().forEach((track) => track.stop());
  engine.canvasStream?.getTracks().forEach((track) => track.stop());
  engine.video.srcObject = null;
  engine.mediaStream = null;
  engine.canvasStream = null;
};
