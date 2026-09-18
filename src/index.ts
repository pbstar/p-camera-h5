import type {
  CameraController,
  CameraOptions,
  ResolvedOptions,
} from "./types";
import {
  DEFAULT_FACING_MODE,
  DEFAULT_JPEG_QUALITY,
  elTemplate,
} from "./constants";
import { setupCamera, destroyCamera, type CameraEngine } from "./media";
import {
  blobToFile,
  describeMediaError,
  extFromMime,
  pickRecordingMime,
  setLoading,
  showError,
} from "./utils";

// 类型从入口导出，供消费方 `import type { ... } from "p-camera-h5"` 使用
export type {
  CameraController,
  CameraOptions,
  ResolvedOptions,
  Watermark,
  WatermarkText,
  WatermarkImage,
  FacingMode,
} from "./types";

/** MediaRecorder 的 error 事件在部分 TS 版本中未声明 error 字段 */
type MediaRecorderErrorEvent = Event & { error?: DOMException };

/** 校验并合并配置默认值 */
const resolveConfig = (options: CameraOptions): ResolvedOptions => {
  if (!options || !options.el || !(options.el instanceof HTMLElement)) {
    throw new Error("[p-camera-h5] options.el 必须为有效的 HTMLElement");
  }
  const facingMode = options.facingMode ?? DEFAULT_FACING_MODE;
  if (facingMode !== "user" && facingMode !== "environment") {
    throw new Error('[p-camera-h5] facingMode 仅支持 "user" 或 "environment"');
  }
  return {
    el: options.el,
    facingMode,
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

  // 渲染模板（样式随容器一同插入，destroy 清空容器时同步移除）
  el.innerHTML = elTemplate;
  const container = el.querySelector(".p-camera-h5") as HTMLElement | null;
  if (!container) throw new Error("[p-camera-h5] 模板渲染异常：未找到 .p-camera-h5 容器");

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
  // stop 事件是异步的，用它标记「已请求停止、尚未收到 onstop」，避免重复调用覆盖回调
  let stopping = false;
  // destroy 时用于拒绝尚在等待 onstop 的 stopRecording 调用，避免调用方永久挂起
  let rejectPendingStop: ((err: Error) => void) | null = null;

  const ensureAlive = (): CameraEngine => {
    if (!engine) throw new Error("[p-camera-h5] 相机实例已销毁");
    return engine;
  };

  /** 录像结束（正常停止或出错）后统一重置状态 */
  const resetRecording = (): void => {
    recording = false;
    paused = false;
    stopping = false;
    recorder = null;
    chunks = [];
    rejectPendingStop = null;
  };

  /** 拍照，返回 JPEG 图片文件 */
  const capture = (): Promise<File> =>
    new Promise((resolve, reject) => {
      const current = ensureAlive();
      current.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blobToFile(blob, "jpg"));
          else reject(new Error("[p-camera-h5] 生成图片失败"));
        },
        "image/jpeg",
        DEFAULT_JPEG_QUALITY
      );
    });

  /** 开始录像 */
  const startRecording = (): Promise<void> =>
    new Promise((resolve, reject) => {
      const current = ensureAlive();
      if (recording) return reject(new Error("[p-camera-h5] 已在录像中"));
      // 非安全上下文或不支持的浏览器中 MediaRecorder 不存在，提前拦截
      if (typeof MediaRecorder === "undefined") {
        return reject(
          new Error("[p-camera-h5] 当前浏览器不支持 MediaRecorder，无法录像")
        );
      }
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
      // 重复调用会覆盖 onstop，使先前的调用永久挂起，因此直接拒绝
      if (stopping) {
        return reject(new Error("[p-camera-h5] 正在停止录像，请勿重复调用"));
      }
      const current = recorder;
      stopping = true;
      current.onstop = () => {
        const type = current.mimeType || "video/webm";
        const blob = new Blob(chunks, { type });
        resetRecording();
        resolve(blobToFile(blob, extFromMime(type)));
      };
      // 录制出错时 onstop 不保证触发，需在此结束等待，避免 Promise 永久挂起
      current.onerror = (event) => {
        const cause = (event as MediaRecorderErrorEvent).error;
        resetRecording();
        reject(describeMediaError(cause ?? new Error("录像过程发生错误")));
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
    if (stopping) {
      throw new Error("[p-camera-h5] 录像正在停止，无法暂停");
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
    if (stopping) {
      throw new Error("[p-camera-h5] 录像正在停止，无法恢复");
    }
    if (!paused) return; // 幂等
    recorder.resume();
    paused = false;
  };

  /** 是否正在录像（暂停中也算录像中） */
  const isRecording = (): boolean => recording;

  /** 销毁实例，释放全部资源 */
  const destroy = (): void => {
    if (!engine) return; // 幂等
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
    // 先取出待拒绝的调用，resetRecording 会清空该引用
    const pending = rejectPendingStop;
    resetRecording();
    if (pending) pending(new Error("[p-camera-h5] 相机实例已销毁，录像终止"));
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
    destroy,
  };
};

export default createCamera;
