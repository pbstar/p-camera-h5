import type {
  Watermark,
  WatermarkText,
  WatermarkImage,
} from "./types";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_IMG_SIZE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_WATERMARK_X,
  DEFAULT_WATERMARK_Y,
} from "./constants";

/** 取有效的正数，否则回退默认值 */
const positiveNum = (value: unknown, fallback: number): number =>
  typeof value === "number" && value > 0 ? value : fallback;

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
  | {
      kind: "image";
      x: number;
      y: number;
      width: number;
      height: number;
      el: HTMLImageElement;
    };

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
  fontSize: positiveNum(t.fontSize, DEFAULT_FONT_SIZE),
});

/** 规范化图片水印，加载失败时告警跳过（不阻断相机初始化） */
const prepareImage = async (
  w: Watermark,
  img: WatermarkImage
): Promise<PreparedWatermark | null> => {
  try {
    const el = await loadImage(img.url);
    return {
      kind: "image",
      x: w.x ?? DEFAULT_WATERMARK_X,
      y: w.y ?? DEFAULT_WATERMARK_Y,
      width: positiveNum(img.width, DEFAULT_IMG_SIZE),
      height: positiveNum(img.height, DEFAULT_IMG_SIZE),
      el,
    };
  } catch (e) {
    console.warn(`[p-camera-h5] ${(e as Error).message}`);
    return null;
  }
};

/** 规范化单条水印配置 */
const prepareOne = async (w: Watermark): Promise<PreparedWatermark | null> => {
  if (w.text && w.img) {
    console.warn("[p-camera-h5] 水印的 text 与 img 同时存在，仅渲染 text");
  }
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

/** 绘制单条水印，x/y 为水印左上角坐标（px），文字与图片语义一致 */
const drawOne = (
  ctx: CanvasRenderingContext2D,
  w: PreparedWatermark,
  dpr: number
): void => {
  const x = w.x * dpr;
  const y = w.y * dpr;

  if (w.kind === "text") {
    // 动态水印（时间等）每帧求值，静态字符串开销可忽略
    const text = typeof w.text === "function" ? w.text() : w.text;
    ctx.fillStyle = w.color;
    ctx.font = `${w.fontSize * dpr}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(text, x, y);
    return;
  }
  ctx.drawImage(w.el, x, y, w.width * dpr, w.height * dpr);
};

/** 绘制全部水印；单条失败仅告警跳过，不影响其余水印与视频画面 */
export const drawWatermarks = (
  ctx: CanvasRenderingContext2D,
  watermarks: PreparedWatermark[] | null,
  dpr: number
): void => {
  if (!watermarks) return;
  for (const w of watermarks) {
    ctx.save();
    try {
      drawOne(ctx, w, dpr);
    } catch (err) {
      console.warn(`[p-camera-h5] 水印绘制失败，已跳过该条: ${(err as Error).message}`);
    } finally {
      // 异常时也要恢复画布状态，避免 save/restore 失衡
      ctx.restore();
    }
  }
};
