import type { Watermark, WatermarkText, WatermarkImage } from "./types";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_IMG_SIZE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_WATERMARK_X,
  DEFAULT_WATERMARK_Y,
} from "./constants";

/** 像素值转数字，兼容 "18px" 字符串 */
const pxToNum = (px: unknown): number => {
  if (typeof px === "number") return px;
  if (typeof px === "string") return parseInt(px.replace("px", ""), 10) || 0;
  return 0;
};

/** 规范化后的水印，绘制时直接使用 */
export type PreparedWatermark =
  | {
      kind: "text";
      x: number;
      y: number;
      text: string | (() => string);
      color: string;
      fontSize: number;
    }
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

/** 规范化文字水印 */
const prepareText = (w: Watermark, t: WatermarkText): PreparedWatermark => ({
  kind: "text",
  x: w.x ?? DEFAULT_WATERMARK_X,
  y: w.y ?? DEFAULT_WATERMARK_Y,
  text: t.content,
  color: t.color ?? DEFAULT_TEXT_COLOR,
  fontSize: pxToNum(t.fontSize) || DEFAULT_FONT_SIZE,
});

/** 规范化图片水印，加载失败时告警跳过（不阻断相机初始化） */
const prepareImage = async (w: Watermark, img: WatermarkImage): Promise<PreparedWatermark | null> => {
  try {
    const el = await loadImage(img.url);
    return {
      kind: "image",
      x: w.x ?? DEFAULT_WATERMARK_X,
      y: w.y ?? DEFAULT_WATERMARK_Y,
      width: pxToNum(img.width) || DEFAULT_IMG_SIZE,
      height: pxToNum(img.height) || DEFAULT_IMG_SIZE,
      el,
    };
  } catch (e) {
    console.warn(`[p-camera-h5] ${(e as Error).message}`);
    return null;
  }
};

/** 规范化单条水印配置 */
const prepareOne = async (w: Watermark): Promise<PreparedWatermark | null> => {
  if (w.text) return prepareText(w, w.text);
  if (w.img) return prepareImage(w, w.img);
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
      // 动态水印（时间等）每帧求值，静态字符串开销可忽略
      const text = typeof w.text === "function" ? w.text() : w.text;
      ctx.fillStyle = w.color;
      ctx.font = `${w.fontSize * dpr}px sans-serif`;
      ctx.fillText(text, w.x * dpr, w.y * dpr);
    } else {
      ctx.drawImage(w.el, w.x * dpr, w.y * dpr, w.width * dpr, w.height * dpr);
    }
    ctx.restore();
  }
};
