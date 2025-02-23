const createProcessedStream = (media: any, config: any) => {
  if (!media.canvasCtx || !media.mediaStream) throw new Error("初始化失败");
  if (!media.video) throw new Error("video is required");
  const canvas = document.getElementById("p-canvas") as HTMLCanvasElement;
  canvas.width = media.video.clientWidth;
  canvas.height = media.video.clientHeight;
  const processedStream = canvas.captureStream(30);
  const audioTracks = media.mediaStream.getAudioTracks();
  if (audioTracks.length > 0) {
    processedStream.addTrack(audioTracks[0]);
  }

  const videoElement = document.createElement("video");
  videoElement.srcObject = new MediaStream(media.mediaStream.getVideoTracks());
  videoElement.onloadedmetadata = () => {
    videoElement.play();
    drawVideoFrame(videoElement, media, config);
  };

  return processedStream;
};
const drawVideoFrame = (v: any, media: any, config: any) => {
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
  drawWatermark(media, config);
  media.animationFrameId = requestAnimationFrame(() =>
    drawVideoFrame(v, media, config)
  );
};
const drawWatermark = (media: any, config: any) => {
  if (media.isWatermarkVisible === false) return;
  if (config.watermark.visible === false) return;

  if (!media.canvasCtx.canvas) throw new Error("Canvas is not initialized");
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
export const setupCamera = async (media: any, config: any) => {
  try {
    media.video = document.getElementById("p-video");
    const canvas: any = document.getElementById("p-canvas");

    // 获取原始媒体流
    media.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
      },
      audio: true,
    });

    // 初始化Canvas
    media.canvasCtx = canvas.getContext("2d");

    // 处理水印图片
    if (config.watermark.visible && config.watermark.image) {
      const img = new Image();
      img.src = config.watermark.image.url;
      img.width = config.watermark.image.width || 100;
      img.height = config.watermark.image.height || 100;
      img.crossOrigin = "Anonymous";
      // contain
      img.style.objectFit = "contain";
      //允许重定向
      img.referrerPolicy = "no-referrer";
      await new Promise((resolve) => {
        img.onload = () => resolve(img);
      });
      config.watermark.image.element = img;
    }

    // 创建带水印的视频流
    media.canvasStream = createProcessedStream(media, config);

    // 显示处理后的视频
    media.video.srcObject = media.canvasStream;
  } catch (error: any) {
    throw new Error("Error accessing media devices: " + error.message);
  }
};
