import type { Watermark } from "./types";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_IMG_SIZE,
  DEFAULT_TEXT_COLOR,
} from "./constants";

/** 像素值转数字，兼容 "18px" 字符串 */
const pxToNum = (px: unknown): number => {
  if (typeof px === "number") return px;
  if (typeof px === "string") return parseInt(px.replace("px", ""), 10) || 0;
  return 0;
};

/** 规范化后的水印，绘制时直接使用 */
export type PreparedWatermark =
  | { kind: "text"; x: number; y: number; text: string; color: string; fontSize: number }
  | { kind: "image"; x: number; y: number; width: number; height: number; el: HTMLImageElement };

/** 加载图片，失败时 reject */
const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片水印加载失败: ${url}`));
    img.src = url;
  });

/** 规范化单条水印配置 */
const prepareOne = async (
  w: Watermark
): Promise<PreparedWatermark | null> => {
  const x = w.x ?? 10;
  const y = w.y ?? 28;
  if (w.text) {
    const t =
      typeof w.text === "string"
        ? { text: w.text }
        : w.text;
    return {
      kind: "text",
      x,
      y,
      text: t.text,
      color: t.color ?? DEFAULT_TEXT_COLOR,
      fontSize: pxToNum(t.fontSize) || DEFAULT_FONT_SIZE,
    };
  }
  if (w.img) {
    const img = typeof w.img === "string" ? { url: w.img } : w.img;
    try {
      const el = await loadImage(img.url);
      return {
        kind: "image",
        x,
        y,
        width: pxToNum(img.width) || DEFAULT_IMG_SIZE,
        height: pxToNum(img.height) || DEFAULT_IMG_SIZE,
        el,
      };
    } catch (e) {
      // 单张图片水印加载失败不阻断相机，仅告警跳过
      console.warn(`[p-camera-h5] ${(e as Error).message}`);
      return null;
    }
  }
  return null;
};

/** 规范化水印配置并预加载图片，返回可绘制的水印列表 */
export const prepareWatermarks = async (
  watermark: Watermark[] | null
): Promise<PreparedWatermark[] | null> => {
  if (!watermark || watermark.length === 0) return null;
  const list = await Promise.all(watermark.map(prepareOne));
  const result = list.filter((w): w is PreparedWatermark => w !== null);
  return result.length > 0 ? result : null;
};

/** 绘制全部水印 */
export const drawWatermarks = (
  ctx: CanvasRenderingContext2D,
  watermarks: PreparedWatermark[] | null,
  dpr: number
): void => {
  if (!watermarks) return;
  for (const w of watermarks) {
    ctx.save();
    if (w.kind === "text") {
      ctx.fillStyle = w.color;
      ctx.font = `${w.fontSize * dpr}px sans-serif`;
      ctx.fillText(w.text, w.x * dpr, w.y * dpr);
    } else {
      ctx.drawImage(w.el, w.x * dpr, w.y * dpr, w.width * dpr, w.height * dpr);
    }
    ctx.restore();
  }
};
