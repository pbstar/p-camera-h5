import { error } from "./utils";
const createProcessedStream = (media: any, config: any) => {
  if (!media.canvasCtx || !media.mediaStream || !media.video)
    return error("初始化失败");
  const canvas = document.createElement("canvas");
  const dpr = media.dpr;
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
      drawVideoFrame(videoElement, media, config);
    });
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
  if (config.watermark && config.watermark.length > 0) {
    drawWatermark(media, config);
  }
  media.animationFrameId = requestAnimationFrame(() =>
    drawVideoFrame(v, media, config)
  );
};
const drawWatermark = (media: any, config: any) => {
  if (!media.canvasCtx.canvas) return error("Canvas is not initialized");
  const dpr = media.dpr;
  config.watermark.forEach((item: any) => {
    const x = item.x * dpr;
    const y = item.y * dpr;
    media.canvasCtx.save();
    media.canvasCtx.scale(1 / dpr, 1 / dpr); // 缩放回逻辑像素
    if (item.text) {
      media.canvasCtx.fillStyle = item.text.color;
      media.canvasCtx.font = `${item.text.fontSize * dpr}px sans-serif`;
      media.canvasCtx.fillText(item.text.text, x, y);
    } else if (item.img) {
      media.canvasCtx.drawImage(
        item.img.el,
        x,
        y,
        item.img.width * dpr,
        item.img.height * dpr
      );
    }
    media.canvasCtx.restore();
  });
};
export const setupCamera = async (media: any, config: any) => {
  try {
    media.video = document.getElementById("p-video");
    const canvas = document.createElement("canvas");
    canvas.width = media.width;
    canvas.height = media.height;
    // 获取原始媒体流
    media.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: config.facingMode || "environment",
      },
      audio: config.isAudio,
    });
    // 初始化Canvas
    media.canvasCtx = canvas.getContext("2d", {
      alpha: false, // 关闭透明度提升渲染性能
      willReadFrequently: false, // 关闭频繁读取提升渲染性能
    });
    // 处理水印数据
    if (config.watermark) {
      config.watermark.forEach((item: any) => {
        if (item.text) {
          if (typeof item.text === "string") {
            item.text = {
              text: item.text,
              fontSize: 20,
              color: "rgba(255, 255, 255, 0.5)",
            };
          }
          if (item.text.fontSize.toString().indexOf("px") > -1) {
            item.text.fontSize = parseInt(
              item.text.fontSize.toString().replace("px", "")
            );
          }
        }
        if (item.img) {
          if (typeof item.img === "string") {
            item.img = {
              url: item.img,
              width: 100,
              height: 100,
            };
          }
          if (item.img.url) {
            const img = new Image();
            img.src = item.img.url;
            item.img.el = img;
          }
        }
      });
    }
    // 创建带水印的视频流
    media.canvasStream = createProcessedStream(media, config);
    // 显示处理后的视频
    media.video.srcObject = media.canvasStream;
  } catch (e: any) {
    return error("Error accessing media devices: " + e.message);
  }
};
// 处理水印图片
// if (config.watermark.visible && config.watermark.image) {
//   const img = new Image();
//   const dpr = window.devicePixelRatio || 1;
//   img.src = config.watermark.image.url + "?r=" + new Date().getTime();
//   img.width = (config.watermark.image.width || 100) * dpr;
//   img.height = (config.watermark.image.height || 100) * dpr;
//   img.crossOrigin = "Anonymous";
//   // contain
//   img.style.objectFit = "contain";
//   //允许重定向
//   img.referrerPolicy = "no-referrer";
//   await new Promise((resolve) => {
//     img.onload = () => resolve(img);
//     img.onerror = () => {
//       error("Error accessing media devices: watermark image load error");
//       return resolve(img);
//     };
//   });
//   config.watermark.image.element = img;
// }
