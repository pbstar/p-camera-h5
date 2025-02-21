import style from "./assets/style.css";
type opt = {
  el: HTMLElement;
  watermark: {
    text: string;
    image: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    color: string;
    fontSize: string;
  };
};
const elTemplate = `
  <div id="p-camera-h5">
    <div id="p-loading">加载中...</div>
    <div id="p-error"></div>
    <div id="p-container">
      <video id="p-video" autoplay playsinline></video>
      <canvas id="p-canvas" style="display:none;"></canvas>
    </div>
    <div id="p-watermark-btn">关闭水印</div>
    <div id="p-capture-btn">拍照</div>
    <div id="p-record-btn">录制</div>
    <div id="p-record-time">00:00</div>
  </div>
`;
class pCameraH5 {
  #config: opt;
  #mediaStream: MediaStream | null;
  #mediaRecorder: MediaRecorder | null;
  #recordedChunks: Blob[];
  #video: HTMLVideoElement | null;
  #watermarkBtn: HTMLButtonElement | null;
  #captureBtn: HTMLButtonElement | null;
  #recordBtn: HTMLButtonElement | null;
  #recordTimer: number | null;
  #watermarkImage: HTMLImageElement | null;
  #loading: HTMLDivElement | null;
  #canvasCtx: CanvasRenderingContext2D | null;
  #canvasStream: MediaStream | null;
  #animationFrameId: number | null;
  #isWatermarkVisible = true;

  constructor(options: opt) {
    this.#config = {
      el: document.body,
      watermark: {
        text: "",
        image: "",
        position: "bottom-right", // 支持 top-left, top-right, bottom-left, bottom-right
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "20px",
      },
    };
    if (!options.el) throw new Error("el is required");
    Object.assign(this.#config, options);

    this.#mediaStream = null;
    this.#mediaRecorder = null;
    this.#recordedChunks = [];
    this.#video = null;
    this.#watermarkBtn = null;
    this.#captureBtn = null;
    this.#recordBtn = null;
    this.#recordTimer = null;
    this.#watermarkImage = null;
    this.#loading = null;
    this.#canvasCtx = null;
    this.#canvasStream = null;
    this.#animationFrameId = null;
    this.#isWatermarkVisible = true;
    this.init();
  }

  async init() {
    this.#setupUI();
    this.#setupBtns();
    await this.#setupCamera();
    this.#loading = document.getElementById("p-loading") as HTMLDivElement;
    this.#loading.style.display = "none";
  }

  #setupUI() {
    // 加载相机模板
    this.#config.el.innerHTML = elTemplate;
    // 加载css样式
    const styleElement = document.createElement("style");
    styleElement.innerHTML = Object.values(style).join("");
    this.#config.el.appendChild(styleElement);
  }

  #setupBtns() {
    this.#watermarkBtn = document.getElementById(
      "p-watermark-btn"
    ) as HTMLButtonElement;
    this.#captureBtn = document.getElementById(
      "p-capture-btn"
    ) as HTMLButtonElement;
    this.#recordBtn = document.getElementById(
      "p-record-btn"
    ) as HTMLButtonElement;

    if (!this.#captureBtn || !this.#recordBtn)
      throw new Error("Buttons not initialized");

    this.#watermarkBtn.addEventListener("click", () => this.toggleWatermark());
    this.#captureBtn.addEventListener("click", () => this.handleCapture());
    this.#recordBtn.addEventListener("click", () => this.handleRecording());
  }

  async #setupCamera() {
    try {
      this.#video = document.getElementById("p-video") as HTMLVideoElement;
      const canvas = document.getElementById("p-canvas") as HTMLCanvasElement;

      // 获取原始媒体流
      this.#mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // 初始化Canvas
      this.#canvasCtx = canvas.getContext("2d");

      // 创建带水印的视频流
      this.#canvasStream = this.#createProcessedStream();

      // 显示处理后的视频
      this.#video.srcObject = this.#canvasStream;
    } catch (error: any) {
      throw new Error("Error accessing media devices: " + error.message);
    }
  }

  #createProcessedStream(): MediaStream {
    if (!this.#canvasCtx || !this.#mediaStream) throw new Error("初始化失败");
    if (!this.#video) throw new Error("video is required");
    const canvas = document.getElementById("p-canvas") as HTMLCanvasElement;
    canvas.width = this.#video.clientWidth;
    canvas.height = this.#video.clientHeight;
    const processedStream = canvas.captureStream(30);
    const audioTracks = this.#mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      processedStream.addTrack(audioTracks[0]);
    }

    const videoElement = document.createElement("video");
    videoElement.srcObject = new MediaStream(
      this.#mediaStream.getVideoTracks()
    );
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      this.#drawVideoFrame(videoElement);
    };

    return processedStream;
  }

  #drawVideoFrame(video: HTMLVideoElement) {
    if (!this.#canvasCtx || !this.#video) return;

    const scaleRatio = Math.max(
      this.#video.clientWidth / video.videoWidth,
      this.#video.clientHeight / video.videoHeight
    );

    // 根据缩放比例计算绘制时的宽度和高度
    const drawWidth = video.videoWidth * scaleRatio;
    const drawHeight = video.videoHeight * scaleRatio;

    // 计算图像在Canvas上的目标位置，使其居中
    const x = (this.#video.clientWidth - drawWidth) / 2;
    const y = (this.#video.clientHeight - drawHeight) / 2;

    this.#canvasCtx.drawImage(video, x, y, drawWidth, drawHeight);
    this.#drawWatermark(this.#canvasCtx);
    this.#animationFrameId = requestAnimationFrame(() =>
      this.#drawVideoFrame(video)
    );
  }

  #drawWatermark(ctx: CanvasRenderingContext2D) {
    if (!this.#isWatermarkVisible) return;

    const [vertical, horizontal] = this.#config.watermark.position.split("-");
    let x = 10,
      y = 10;

    if (horizontal === "right") x = ctx.canvas.width - 200;
    if (vertical === "bottom") y = ctx.canvas.height - 30;

    if (this.#config.watermark.text) {
      ctx.fillStyle = this.#config.watermark.color;
      ctx.font = `${this.#config.watermark.fontSize} sans-serif`;
      ctx.fillText(this.#config.watermark.text, x, y);
    } else if (this.#watermarkImage) {
      ctx.drawImage(this.#watermarkImage, x, y, 100, 30);
    }
  }

  // 修改后的capture方法
  capture() {
    if (!this.#canvasCtx) throw new Error("Canvas未初始化");

    const canvas = document.createElement("canvas");
    canvas.width = this.#video!.videoWidth;
    canvas.height = this.#video!.videoHeight;
    const ctx = canvas.getContext("2d")!;

    // 直接复制已处理好的Canvas内容
    ctx.drawImage(this.#canvasCtx.canvas, 0, 0);
    return canvas.toDataURL("image/png");
  }

  startRecording() {
    this.#recordedChunks = [];
    this.#mediaRecorder = new MediaRecorder(this.#canvasStream!);

    this.#mediaRecorder.ondataavailable = (e) =>
      e.data.size > 0 && this.#recordedChunks.push(e.data);
    this.#mediaRecorder.start();

    // Start timer
    const timeElement = document.getElementById("p-record-time")!;
    timeElement.style.display = "inline";
    let seconds = 0;
    this.#recordTimer = window.setInterval(() => {
      seconds++;
      timeElement.textContent = `${Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
    }, 1000);
  }

  async stopRecording() {
    return new Promise((resolve) => {
      this.#mediaRecorder!.onstop = () => {
        const blob = new Blob(this.#recordedChunks, { type: "video/webm" });
        resolve(URL.createObjectURL(blob));

        // Reset timer
        clearInterval(this.#recordTimer!);
        document.getElementById("p-record-time")!.style.display = "none";
      };
      this.#mediaRecorder?.stop();
    });
  }

  toggleWatermark() {
    if (!this.#watermarkBtn) return;
    this.#isWatermarkVisible = !this.#isWatermarkVisible;
    this.#watermarkBtn!.textContent = this.#isWatermarkVisible
      ? "关闭水印"
      : "打开水印";
  }

  handleCapture() {
    this.#downloadRecording(this.capture(), "png");
  }

  async handleRecording() {
    if (this.#recordBtn?.textContent === "录制") {
      this.startRecording();
      this.#recordBtn.textContent = "停止";
    } else {
      const url = await this.stopRecording();
      this.#downloadRecording(url as string, "webm");
      this.#recordBtn!.textContent = "录制";
    }
  }

  #downloadRecording(url: string, type: "png" | "webm") {
    const ext = type === "png" ? "png" : "mp4";
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  destroy() {
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
    }
    this.#mediaStream?.getTracks().forEach((track) => track.stop());
    this.#config.el.innerHTML = "";
  }
}

export default pCameraH5;
