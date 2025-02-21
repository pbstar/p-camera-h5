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
      <div id="p-watermark"></div>
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
  #watermark: HTMLDivElement | null;
  #watermarkBtn: HTMLButtonElement | null;
  #captureBtn: HTMLButtonElement | null;
  #recordBtn: HTMLButtonElement | null;
  #recordTimer: number | null;
  #watermarkImage: HTMLImageElement | null;
  #loading: HTMLDivElement | null;

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
    this.#watermark = null;
    this.#watermarkBtn = null;
    this.#captureBtn = null;
    this.#recordBtn = null;
    this.#recordTimer = null;
    this.#watermarkImage = null;
    this.#loading = null;

    this.init();
  }

  async init() {
    this.#setupUI();
    this.#setupBtns();
    await this.#setupCamera();
    this.#setupWatermark();
    this.#loading = document.getElementById("p-loading") as HTMLDivElement;
    this.#loading.style.display = "none";
  }

  #setupUI() {
    // 加载相机模板
    this.#config.el.innerHTML = elTemplate;
    // 加载css样式
    const styleElement = document.createElement("style");
    styleElement.innerHTML = JSON.stringify(style);
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
      this.#mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.#video.srcObject = this.#mediaStream;
    } catch (error: any) {
      throw new Error("Error accessing media devices: " + error.message);
    }
  }

  #setupWatermark() {
    if (!this.#config.watermark.text && !this.#config.watermark.image)
      throw new Error("Watermark content required");

    this.#watermark = document.getElementById("p-watermark") as HTMLDivElement;
    Object.assign(this.#watermark.style, {
      position: "absolute",
      pointerEvents: "none",
      color: this.#config.watermark.color,
      fontSize: this.#config.watermark.fontSize,
    });

    const [vertical, horizontal]: any =
      this.#config.watermark.position.split("-");
    this.#watermark.style[vertical] = "10px";
    this.#watermark.style[horizontal] = "10px";

    if (this.#config.watermark.text) {
      this.#watermark.textContent = this.#config.watermark.text;
    } else {
      this.#watermarkImage = new Image();
      this.#watermarkImage.src = this.#config.watermark.image;
      this.#watermark.appendChild(this.#watermarkImage);
    }
  }

  capture() {
    if (!this.#video) throw new Error("Video not initialized");
    const canvas = document.createElement("canvas");
    canvas.width = this.#video.videoWidth;
    canvas.height = this.#video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(this.#video, 0, 0);

    // Draw watermark
    if (this.#watermark?.style.display !== "none") {
      ctx!.fillStyle = this.#config.watermark.color;
      ctx!.font = `${this.#config.watermark.fontSize} sans-serif`;

      const [vertical, horizontal] = this.#config.watermark.position.split("-");
      const x =
        horizontal === "left"
          ? 10
          : canvas.width -
            10 -
            ctx!.measureText(this.#config.watermark.text).width;
      const y = vertical === "top" ? 30 : canvas.height - 10;

      if (this.#config.watermark.text) {
        ctx!.fillText(this.#config.watermark.text, x, y);
      } else if (this.#watermarkImage) {
        ctx!.drawImage(this.#watermarkImage, x, y);
      }
    }

    return canvas.toDataURL("image/png");
  }

  startRecording() {
    this.#recordedChunks = [];
    this.#mediaRecorder = new MediaRecorder(this.#mediaStream!);

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
    if (!this.#watermark || !this.#watermarkBtn) return;

    const isHidden = this.#watermark.style.display === "none";
    this.#watermark.style.display = isHidden ? "block" : "none";
    this.#watermarkBtn.textContent = isHidden ? "关闭水印" : "打开水印";
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
    this.#mediaStream?.getTracks().forEach((track) => track.stop());
    this.#config.el.innerHTML = "";
  }
}

export default pCameraH5;
