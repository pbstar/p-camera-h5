import { error } from "./utils";
export const setupCamera = async (media: any, config: any) => {
  try {
    media.canvas.width = media.width * media.dpr;
    media.canvas.height = media.height * media.dpr;
    media.canvas.style.width = media.width + "px";
    media.canvas.style.height = media.height + "px";

    // 获取原始媒体流
    media.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: config.facingMode || "environment",
      },
      audio: config.isAudio,
    });
    // 初始化Canvas
    media.canvasCtx = media.canvas.getContext("2d", {
      alpha: false, // 关闭透明度提升渲染性能
      willReadFrequently: false, // 关闭频繁读取提升渲染性能
    });
    media.canvasCtx.scale(1, 1);
    media.canvasCtx.imageSmoothingQuality = "high";
    media.canvasCtx.imageSmoothingEnabled = true;
    // 处理水印数据
    if (config.watermark) {
      await handleWatermark(media, config);
    }
    // 创建带水印的视频流
    media.canvasStream = createProcessedStream(media, config);

    // 显示处理后的视频
    media.video.srcObject = media.canvasStream;
  } catch (e: any) {
    return error("Error accessing media devices: " + e.message);
  }
};

// 处理水印数据
const handleWatermark = async (media: any, config: any) => {
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url + "?r=" + new Date().getTime();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  for (const item of config.watermark) {
    if (item.text) {
      if (typeof item.text === "string") {
        item.text = {
          text: item.text,
          fontSize: 20,
          color: "rgba(255, 255, 255, 0.5)",
        };
      }
      if (
        item.text.fontSize &&
        item.text.fontSize.toString().indexOf("px") > -1
      ) {
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
        try {
          const img = await loadImage(item.img.url);
          img.width = item.img.width * media.dpr;
          img.height = item.img.height * media.dpr;
          img.style.objectFit = "contain";
          img.referrerPolicy = "no-referrer";
          item.img.el = img;
        } catch (e) {
          error("Error accessing media devices: watermark image load error");
          console.error(e);
        }
      }
    }
  }
};

const createProcessedStream = (media: any, config: any) => {
  if (!media.canvasCtx || !media.mediaStream || !media.video)
    return error("初始化失败");

  const processedStream = media.canvas.captureStream(30);
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

  // 保存当前的绘图状态
  media.canvasCtx.save();

  // 水平翻转视频（解决左右反转问题）
  media.canvasCtx.scale(-1 * media.dpr, 1 * media.dpr);
  media.canvasCtx.translate(-media.canvas.width / media.dpr, 0);
  media.canvasCtx.drawImage(v, x, y, drawWidth, drawHeight);

  // 恢复之前的绘图状态
  media.canvasCtx.restore();
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
