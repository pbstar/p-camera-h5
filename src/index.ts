import type {
  CameraController,
  CameraOptions,
  CaptureOptions,
  ResolvedOptions,
} from "./types";
import {
  DEFAULT_FACING_MODE,
  DEFAULT_RESOLUTION,
  RESOLUTION_PRESETS,
  elTemplate,
} from "./constants";
import { setupCamera, destroyCamera, switchFacingCamera, type CameraEngine } from "./media";
import {
  blobToFile,
  describeMediaError,
  extFromImageMime,
  extFromMime,
  pickRecordingMime,
  resolveCaptureFormat,
  setLoading,
  showError,
} from "./utils";

// 类型从入口导出，供消费方 `import type { ... } from "p-camera-h5"` 使用
export type {
  CameraController,
  CameraOptions,
  CaptureOptions,
  ResolvedOptions,
  Watermark,
  WatermarkText,
  WatermarkImage,
  FacingMode,
  Resolution,
} from "./types";

/** 校验并合并配置默认值 */
const resolveConfig = (options: CameraOptions): ResolvedOptions => {
  if (!options || !options.el || !(options.el instanceof HTMLElement)) {
    throw new Error("[p-camera-h5] options.el 必须为有效的 HTMLElement");
  }
  const facingMode = options.facingMode ?? DEFAULT_FACING_MODE;
  if (facingMode !== "user" && facingMode !== "environment") {
    throw new Error('[p-camera-h5] facingMode 仅支持 "user" 或 "environment"');
  }
  const resolution = options.resolution ?? DEFAULT_RESOLUTION;
  if (!(resolution in RESOLUTION_PRESETS)) {
    throw new Error('[p-camera-h5] resolution 仅支持 "480p" / "720p" / "1080p"');
  }
  return {
    el: options.el,
    facingMode,
    resolution,
    isAudio: options.isAudio ?? false,
    isMirror: options.isMirror ?? false,
    watermark: options.watermark ?? null,
  };
};

/**
 * 创建相机实例。
 * 初始化异步（需打开摄像头），成功后返回控制器；失败时 reject 并展示错误提示。
 */
export const createCamera = async (
  options: CameraOptions
): Promise<CameraController> => {
  const config = resolveConfig(options);
  const { el } = config;

  // 渲染模板
  el.innerHTML = elTemplate;
  const container = el.firstElementChild as HTMLElement;

  setLoading(container, true);
  let engine: CameraEngine | null = null;
  try {
    engine = await setupCamera(config, container);
  } catch (err) {
    const error = describeMediaError(err);
    showError(container, error.message);
    throw error;
  } finally {
    setLoading(container, false);
  }

  // 录像运行时状态
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let recording = false;
  let paused = false;
  // destroy 时用于拒绝尚在等待 onstop 的 stopRecording 调用，避免调用方永久挂起
  let rejectPendingStop: ((err: Error) => void) | null = null;

  const ensureAlive = (): CameraEngine => {
    if (!engine) throw new Error("[p-camera-h5] 相机实例已销毁");
    return engine;
  };

  /** 拍照，返回图片文件（默认 JPEG，可指定 PNG） */
  const capture = (options?: CaptureOptions): Promise<File> =>
    new Promise((resolve, reject) => {
      const current = ensureAlive();
      const { mime, quality } = resolveCaptureFormat(options?.type);
      current.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blobToFile(blob, extFromImageMime(mime)));
          else reject(new Error("[p-camera-h5] 生成图片失败"));
        },
        mime,
        quality
      );
    });

  /** 开始录像 */
  const startRecording = (): Promise<void> =>
    new Promise((resolve, reject) => {
      const current = ensureAlive();
      if (recording) return reject(new Error("[p-camera-h5] 已在录像中"));
      if (!current.canvasStream) {
        return reject(new Error("[p-camera-h5] 媒体流未就绪"));
      }
      const mimeType = pickRecordingMime();
      recorder =
        mimeType !== ""
          ? new MediaRecorder(current.canvasStream, { mimeType })
          : new MediaRecorder(current.canvasStream);
      chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.start();
      recording = true;
      paused = false;
      resolve();
    });

  /** 停止录像，返回视频文件 */
  const stopRecording = (): Promise<File> =>
    new Promise((resolve, reject) => {
      if (!recorder) return reject(new Error("[p-camera-h5] 未开始录像"));
      const current = recorder;
      current.onstop = () => {
        const type = current.mimeType || "video/webm";
        const blob = new Blob(chunks, { type });
        recording = false;
        paused = false;
        recorder = null;
        chunks = [];
        rejectPendingStop = null;
        resolve(blobToFile(blob, extFromMime(type)));
      };
      // 销毁时 rejectPendingStop 会被调用，避免 Promise 永久挂起
      rejectPendingStop = reject;
      current.stop();
    });

  /** 暂停录像，画面照常渲染，仅暂停内容写入 */
  const pauseRecording = (): void => {
    if (!recording || !recorder) {
      throw new Error("[p-camera-h5] 未开始录像");
    }
    if (paused) return; // 幂等
    recorder.pause();
    paused = true;
  };

  /** 恢复已暂停的录像 */
  const resumeRecording = (): void => {
    if (!recording || !recorder) {
      throw new Error("[p-camera-h5] 未开始录像");
    }
    if (!paused) return; // 幂等
    recorder.resume();
    paused = false;
  };

  /** 是否正在录像（暂停中也算录像中） */
  const isRecording = (): boolean => recording;

  /** 切换前后摄像头，录像中的画面会随之切换且录像不中断 */
  const switchFacing = async (): Promise<void> => {
    const current = ensureAlive();
    try {
      await switchFacingCamera(current);
    } catch (err) {
      throw describeMediaError(err);
    }
  };

  /** 销毁实例，释放全部资源 */
  const destroy = (): void => {
    if (!engine) return; // 幂等
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    recording = false;
    recorder = null;
    chunks = [];
    if (rejectPendingStop) {
      rejectPendingStop(new Error("[p-camera-h5] 相机实例已销毁，录像终止"));
      rejectPendingStop = null;
    }
    destroyCamera(engine);
    el.innerHTML = "";
    engine = null;
  };

  return {
    capture,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    switchFacing,
    destroy,
  };
};

export default createCamera;
