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
  if (!media.canvasCtx.canvas) throw new Error("Canvas is not initialized");
  const [vertical, horizontal] = config.watermark.position.split("-");
  let x = 10,
    y = 25;

  if (horizontal === "right") x = media.canvasCtx.canvas.width - 100;
  if (vertical === "bottom") y = media.canvasCtx.canvas.height - 10;

  if (config.watermark.text) {
    media.canvasCtx.fillStyle = config.watermark.color;
    media.canvasCtx.font = `${config.watermark.fontSize} sans-serif`;
    media.canvasCtx.fillText(config.watermark.text, x, y);
  }
};
export const setupCamera = async (media: any, config: any) => {
  try {
    media.video = document.getElementById("p-video");
    const canvas: any = document.getElementById("p-canvas");

    // 获取原始媒体流
    media.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // 初始化Canvas
    media.canvasCtx = canvas.getContext("2d");

    // 创建带水印的视频流
    media.canvasStream = createProcessedStream(media, config);

    // 显示处理后的视频
    media.video.srcObject = media.canvasStream;
  } catch (error: any) {
    throw new Error("Error accessing media devices: " + error.message);
  }
};
