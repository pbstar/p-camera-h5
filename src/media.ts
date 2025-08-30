import { error } from "./utils";
export const setupCamera = async (media: any, config: any) => {
  try {
    // 设置Canvas大小
    media.canvas.width = media.width * media.dpr;
    media.canvas.height = media.height * media.dpr;
    media.canvas.style.width = media.width + "px";
    media.canvas.style.height = media.height + "px";
    // 获取原始媒体流
    media.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: config.facingMode || "environment",
      },
      audio: config.isAudio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } : false,
    });
    // 初始化canvasCtx
    media.canvasCtx = media.canvas.getContext("2d", {
      alpha: false, // 关闭透明度提升渲染性能
      willReadFrequently: false, // 关闭频繁读取提升渲染性能
    });
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
  // 加载水印图片
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url + "?r=" + new Date().getTime();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };
  // 像素转换为数字
  const pxtoNum = (px: any) => {
    if (typeof px === "number") return px;
    if (typeof px === "string") return parseInt(px.replace("px", ""));
    return 0;
  };
  // 处理水印数据
  for (const item of config.watermark) {
    if (item.text) {
      if (typeof item.text === "string") {
        item.text = {
          text: item.text,
          fontSize: 18,
          color: "rgba(255, 255, 255, 0.5)",
        };
      }
      item.text.fontSize = pxtoNum(item.text.fontSize);
    }
    if (item.img) {
      if (typeof item.img === "string") {
        item.img = {
          url: item.img,
          width: 100,
          height: 100,
        };
      }
      item.img.width = pxtoNum(item.img.width);
      item.img.height = pxtoNum(item.img.height);
      if (item.img.url) {
        try {
          const img = await loadImage(item.img.url);
          img.width = item.img.width * media.dpr;
          img.height = item.img.height * media.dpr;
          img.style.width = item.img.width + "px";
          img.style.height = item.img.height + "px";
          img.style.objectFit = "contain";
          img.referrerPolicy = "no-referrer";
          item.img.el = img;
        } catch (e) {
          return error(
            "Error accessing media devices: watermark image load error"
          );
        }
      }
    }
  }
};
// 创建带水印的视频流
const createProcessedStream = (media: any, config: any) => {
  if (!media.canvasCtx || !media.mediaStream) return error("初始化失败");
  const processedStream = media.canvas.captureStream(30);
  if (config.isAudio) {
    const audioTracks = media.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      processedStream.addTrack(audioTracks[0]);
    }
  }
  const videoElement = document.createElement("video");
  media.processedVideo = videoElement;
  videoElement.srcObject = new MediaStream(media.mediaStream.getVideoTracks());
  videoElement.muted = true; // 必须静音以避免音频回路
  videoElement.playsInline = true;
  videoElement.onloadedmetadata = () => {
    videoElement
      .play()
      .then(() => {
        drawVideoFrame(videoElement, media, config);
      })
      .catch((err) => {
        error("Error playing video: " + err.message);
      });
  };
  return processedStream;
};
// 绘制视频帧
const drawVideoFrame = (v: any, media: any, config: any) => {
  if (!media.canvasCtx) return error("Canvas is not initialized");
  const cw = media.width * media.dpr;
  const ch = media.height * media.dpr;
  // 计算缩放比例以填满画布
  const scaleX = cw / v.videoWidth;
  const scaleY = ch / v.videoHeight;
  const scale = Math.max(scaleX, scaleY);
  // 计算绘制宽高
  const drawWidth = v.videoWidth * scale;
  const drawHeight = v.videoHeight * scale;
  // 计算居中偏移量
  const offsetX = (cw - drawWidth) / 2;
  const offsetY = (ch - drawHeight) / 2;
  // 绘制视频画面
  media.canvasCtx.save();
  media.canvasCtx.clearRect(0, 0, cw, ch);
  if (config.isMirror) {
    media.canvasCtx.scale(-1, 1);
    media.canvasCtx.drawImage(
      v,
      -offsetX - drawWidth,
      offsetY,
      drawWidth,
      drawHeight
    );
  } else {
    media.canvasCtx.drawImage(v, offsetX, offsetY, drawWidth, drawHeight);
  }
  media.canvasCtx.restore();
  // 绘制水印
  if (config.watermark && config.watermark.length > 0) {
    drawWatermark(media, config);
  }
  media.animationFrameId = requestAnimationFrame(() =>
    drawVideoFrame(v, media, config)
  );
};
const drawWatermark = (media: any, config: any) => {
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
