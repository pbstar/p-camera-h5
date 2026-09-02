import { DEFAULT_JPEG_QUALITY } from "./constants";

/** Blob 转为 File，文件名为 pCameraH5-{时间戳}.{扩展名} */
export const blobToFile = (blob: Blob, ext: string): File => {
  return new File([blob], `pCameraH5-${Date.now()}.${ext}`, {
    type: blob.type,
  });
};

/** 候选录像格式，按通用性排序：优先 mp4（iOS/Safari 兼容） */
const MIME_CANDIDATES = [
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

/** 选取当前浏览器支持的录像 MIME 类型 */
export const pickRecordingMime = (): string => {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return "";
  }
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
};

/** 根据图片 MIME 推导文件扩展名 */
export const extFromImageMime = (mime: string): string =>
  mime === "image/png" ? "png" : "jpg";

/** 根据视频 MIME 类型推导文件扩展名 */
export const extFromMime = (mime: string): string =>
  mime.includes("mp4") ? "mp4" : "webm";

/** 校验并规范化拍照格式，JPEG 使用固定的内部质量 */
export const resolveCaptureFormat = (type?: string): { mime: string; quality: number } => {
  const mime = type === "image/png" ? "image/png" : "image/jpeg";
  const quality = mime === "image/jpeg" ? DEFAULT_JPEG_QUALITY : 1;
  return { mime, quality };
};

/** 将 getUserMedia 等底层错误转成可读信息 */
export const describeMediaError = (err: unknown): Error => {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return new Error("摄像头/麦克风权限被拒绝");
      case "NotFoundError":
        return new Error("未检测到可用的摄像头设备");
      case "NotReadableError":
        return new Error("摄像头被占用或无法读取");
      case "OverconstrainedError":
        return new Error("无法满足摄像头约束条件");
    }
  }
  return err instanceof Error ? err : new Error(String(err));
};

/** 在容器内显示加载中提示 */
export const setLoading = (container: HTMLElement, visible: boolean): void => {
  const el = container.querySelector(".p-camera-loading") as HTMLElement | null;
  if (el) el.style.display = visible ? "block" : "none";
};

/** 在容器内显示错误提示 */
export const showError = (container: HTMLElement, message: string): void => {
  const el = container.querySelector(".p-camera-error") as HTMLElement | null;
  if (el) {
    el.textContent = message;
    el.style.display = "block";
  }
  console.error(`[p-camera-h5] ${message}`);
};
