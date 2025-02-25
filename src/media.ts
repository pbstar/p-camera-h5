import { error } from "./utils";
const createProcessedStream = (media: any, config: any, err: any) => {
  if (!media.canvasCtx || !media.mediaStream) return error(err, "初始化失败");
  if (!media.video) return error(err, "video is required");
  const canvas = document.getElementById("p-canvas") as HTMLCanvasElement;
  const dpr = window.devicePixelRatio || 1;
  // 根据设备像素比设置canvas尺寸
  canvas.width = media.video.clientWidth * dpr;
  canvas.height = media.video.clientHeight * dpr;

  // 提升画布绘制质量
  media.canvasCtx.scale(dpr, dpr);
  media.canvasCtx.imageSmoothingQuality = "high";
  media.canvasCtx.imageSmoothingEnabled = true;

  const processedStream = canvas.captureStream(30);
  if (config.isAudio) {
    const audioTracks = media.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      processedStream.addTrack(audioTracks[0]);
    }
  }
  const videoElement = document.createElement("video");
  videoElement.srcObject = new MediaStream(media.mediaStream.getVideoTracks());
  videoElement.onloadedmetadata = () => {
    videoElement.play().then(() => {
      drawVideoFrame(videoElement, media, config, err);
    });
  };

  return processedStream;
};
const drawVideoFrame = (v: any, media: any, config: any, err: any) => {
  if (!media.canvasCtx || !media.video) return;
  const scaleRatio = Math.max(
    media.video.clientWidth / v.videoWidth,
    media.video.clientHeight / v.videoHeight
  );

  // 根据缩放比例计算绘制时的宽度和高度
  const drawWidth = v.videoWidth * scaleRatio;
  const drawHeight = v.videoHeight * scaleRatio;

  // 计算图像在Canvas上的目标位置，使其居中
  const x = (media.video.clientWidth - drawWidth) / 2;
  const y = (media.video.clientHeight - drawHeight) / 2;

  media.canvasCtx.drawImage(v, x, y, drawWidth, drawHeight);

  drawWatermark(media, config, err);
  media.animationFrameId = requestAnimationFrame(() =>
    drawVideoFrame(v, media, config, err)
  );
};
const drawWatermark = (media: any, config: any, err: any) => {
  if (media.isWatermarkVisible === false) return;
  if (config.watermark.visible === false) return;
  if (!media.canvasCtx.canvas) return error(err, "Canvas is not initialized");
  const dpr = window.devicePixelRatio || 1;
  const x = config.watermark.x ? config.watermark.x * dpr : 10 * dpr;
  const y = config.watermark.y ? config.watermark.y * dpr : 10 * dpr;
  if (config.watermark.text) {
    // 文字水印适配DPI
    let baseFontSize = 20;
    if (config.watermark.text.fontSize) {
      //如果有px去掉px
      if (config.watermark.text.fontSize.toString().indexOf("px") > -1) {
        baseFontSize = parseInt(
          config.watermark.text.fontSize.replace("px", "")
        );
      } else {
        baseFontSize = parseInt(config.watermark.text.fontSize);
      }
    }
    const fontSize = baseFontSize * dpr;
    media.canvasCtx.save();
    media.canvasCtx.scale(1 / dpr, 1 / dpr); // 缩放回逻辑像素
    media.canvasCtx.fillStyle = config.watermark.text.color || "#FFFFFF";
    media.canvasCtx.font = `${fontSize}px sans-serif`;
    media.canvasCtx.fillText(config.watermark.text.text, x, y);
    media.canvasCtx.restore();
  }
  if (config.watermark.image) {
    // 图片水印高清绘制
    const width = config.watermark.image.width
      ? config.watermark.image.width * dpr
      : 100 * dpr;
    const height = config.watermark.image.height
      ? config.watermark.image.height * dpr
      : 100 * dpr;
    media.canvasCtx.save();
    media.canvasCtx.scale(1 / dpr, 1 / dpr); // 缩放回逻辑像素

    media.canvasCtx.drawImage(
      config.watermark.image.element,
      x,
      y,
      width,
      height
    );
    media.canvasCtx.restore();
  }
};
export const setupCamera = async (media: any, config: any, err: any) => {
  try {
    media.video = document.getElementById("p-video");
    const canvas: any = document.getElementById("p-canvas");
    let facingMode = "environment";
    if (config.facingMode) facingMode = config.facingMode;
    // 获取原始媒体流
    media.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
      },
      audio: config.isAudio,
    });
    // 初始化Canvas
    media.canvasCtx = canvas.getContext("2d", {
      alpha: false, // 关闭透明度提升渲染性能
      willReadFrequently: false, // 关闭频繁读取提升渲染性能
    });
    // 处理水印图片
    if (config.watermark.visible && config.watermark.image) {
      const img = new Image();
      const dpr = window.devicePixelRatio || 1;
      img.src = config.watermark.image.url + "?r=" + new Date().getTime();
      img.width = (config.watermark.image.width || 100) * dpr;
      img.height = (config.watermark.image.height || 100) * dpr;
      img.crossOrigin = "Anonymous";
      // contain
      img.style.objectFit = "contain";
      //允许重定向
      img.referrerPolicy = "no-referrer";
      await new Promise((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => {
          error(
            err,
            "Error accessing media devices: watermark image load error"
          );
          return resolve(img);
        };
      });
      config.watermark.image.element = img;
    }
    // 创建带水印的视频流
    media.canvasStream = createProcessedStream(media, config, err);
    // 显示处理后的视频
    media.video.srcObject = media.canvasStream;
  } catch (e: any) {
    return error(err, "Error accessing media devices: " + e.message);
  }
};
