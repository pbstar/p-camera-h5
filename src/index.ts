import type {
  CameraController,
  CameraOptions,
  ResolvedOptions,
} from "./types";
import { DEFAULT_FACING_MODE, elTemplate } from "./constants";
import { setupCamera, destroyCamera, type CameraEngine } from "./media";
import {
  blobToFile,
  describeMediaError,
  extFromMime,
  pickRecordingMime,
  setLoading,
  showError,
} from "./utils";

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

  const ensureAlive = (): CameraEngine => {
    if (!engine) throw new Error("[p-camera-h5] 相机实例已销毁");
    return engine;
  };

  /** 拍照，返回 PNG 图片文件 */
  const capture = (): Promise<File> =>
    new Promise((resolve, reject) => {
      const current = ensureAlive();
      current.canvas.toBlob((blob) => {
        if (blob) resolve(blobToFile(blob, "png"));
        else reject(new Error("[p-camera-h5] 生成图片失败"));
      }, "image/png");
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
        recorder = null;
        chunks = [];
        resolve(blobToFile(blob, extFromMime(type)));
      };
      current.stop();
    });

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
    destroyCamera(engine);
    el.innerHTML = "";
    engine = null;
  };

  return { capture, startRecording, stopRecording, destroy };
};

export default createCamera;
