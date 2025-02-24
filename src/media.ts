import { error } from "./utils";
const createProcessedStream = (media: any, config: any, err: any) => {
  if (!media.canvasCtx || !media.mediaStream) return error(err, "初始化失败");
  if (!media.video) return error(err, "video is required");
  const canvas = document.getElementById("p-canvas") as HTMLCanvasElement;
  canvas.width = media.video.clientWidth;
  canvas.height = media.video.clientHeight;
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
    videoElement.play();
    drawVideoFrame(videoElement, media, config, err);
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
  let x = 10,
    y = 10;
  if (config.watermark.x) x = config.watermark.x;
  if (config.watermark.y) y = config.watermark.y;
  if (config.watermark.text) {
    let fontSize = "20px";
    if (config.watermark.text.color)
      media.canvasCtx.fillStyle = config.watermark.text.color;
    if (config.watermark.text.fontSize)
      fontSize = config.watermark.text.fontSize;
    media.canvasCtx.font = `${fontSize} sans-serif`;
    media.canvasCtx.fillText(config.watermark.text.text, x, y);
  }
  if (config.watermark.image) {
    let width = 100,
      height = 100;
    if (config.watermark.image.width) width = config.watermark.image.width;
    if (config.watermark.image.height) height = config.watermark.image.height;
    media.canvasCtx.drawImage(
      config.watermark.image.element,
      x,
      y,
      width,
      height
    );
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
    media.canvasCtx = canvas.getContext("2d");

    // 处理水印图片
    if (config.watermark.visible && config.watermark.image) {
      const img = new Image();
      img.src =
        config.watermark.image.url +
        "?r=" +
        Math.random().toString(36).substr(2);
      img.width = config.watermark.image.width || 100;
      img.height = config.watermark.image.height || 100;
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
