import { CameraOptions, Media, Btns } from "./types";
import { elTemplate } from "./constants";
import { setupCamera } from "./media";
import {
  base64ToFile,
  blobToFile,
  downloadFile,
  deepMerge,
  error,
} from "./utils";
import style from "./assets/style.css";

class pCameraH5 {
  #config: CameraOptions;
  #media: Media | null;
  #btns: Btns | null;
  #watch: any; //camera,record
  #error: any;
  #initialized = false;
  api: { [key: string]: Function };
  on: (type: string, callback: Function) => void;
  off: (type: string, callback: Function) => void;
  constructor(options: CameraOptions) {
    this.#config = {
      el: null,
      facingMode: "environment", // "user" | "environment"
      isAudio: false,
      style: "", // 自定义样式
      watermark: {
        visible: false,
      },
    };

    //深度合并配置，包括二级属性
    this.#config = deepMerge(this.#config, options);
    this.#error = null;
    this.#media = {};
    this.#btns = {};
    this.#watch = {};
    this.init();
    this.api = {
      init: this.init.bind(this),
      capture: this.capture.bind(this),
      startRecording: this.startRecording.bind(this),
      stopRecording: this.stopRecording.bind(this),
      destroy: this.destroy.bind(this),
      downloadFile: downloadFile.bind(this),
    };
    this.on = (type: string, callback: Function) => {
      this.#watch[type] = callback;
    };
    this.off = (type: string) => {
      delete this.#watch[type];
    };
  }

  async init() {
    if (this.#initialized) {
      console.warn("Camera is already initialized");
      return;
    }
    this.#initialized = true;
    this.#setupUI();
    this.#setupBtns();
    await setupCamera(this.#media, this.#config, this.#error);
    const loading = document.getElementById("p-loading") as HTMLDivElement;
    loading.style.display = "none";
  }

  #setupUI() {
    // 加载相机模板
    if (!this.#config.el) return console.error("el is required");
    this.#config.el.innerHTML = elTemplate;

    this.#error = document.getElementById("p-error") as HTMLDivElement;
    // 加载css样式
    const styleElement = document.createElement("style");
    let styleStr = Object.values(style).join("");
    if (this.#config.style) styleStr += this.#config.style;
    styleElement.innerHTML = styleStr;
    this.#config.el.appendChild(styleElement);
  }

  #setupBtns() {
    if (!this.#btns) this.#btns = {};
    this.#btns.watermarkBtn = document.getElementById("p-watermark-btn");
    this.#btns.captureBtn = document.getElementById("p-capture-btn");
    this.#btns.recordBtn = document.getElementById("p-record-btn");

    if (
      !this.#btns.watermarkBtn ||
      !this.#btns.captureBtn ||
      !this.#btns.recordBtn
    )
      return error(this.#error, "Buttons not initialized");

    if (this.#config.watermark && this.#config.watermark.visible) {
      this.#btns.watermarkBtn.addEventListener("click", () =>
        this.handleWatermark()
      );
    } else {
      this.#btns.watermarkBtn.style.display = "none";
    }

    this.#btns.captureBtn.addEventListener("click", () => this.handleCapture());
    this.#btns.recordBtn.addEventListener("click", () =>
      this.handleRecording()
    );
  }

  // 拍照
  capture() {
    if (!this.#media) return error(this.#error, "Media is not initialized");
    if (!this.#media.canvasCtx) return error(this.#error, "Canvas未初始化");
    if (!this.#media.video) return error(this.#error, "Video未初始化");
    const canvas = document.createElement("canvas");
    canvas.width = this.#media.video.videoWidth;
    canvas.height = this.#media.video.videoHeight;
    const ctx: any = canvas.getContext("2d");
    ctx.drawImage(this.#media.canvasCtx.canvas, 0, 0);
    if (this.#watch && this.#watch["capture"])
      this.#watch["capture"](
        base64ToFile(canvas.toDataURL("image/png"), "png")
      );
  }
  // 开始录像
  startRecording() {
    if (!this.#media) return error(this.#error, "Media is not initialized");
    this.#media.recordedChunks = [];
    if (!this.#media.canvasStream)
      return error(this.#error, "canvasStream is required");
    this.#media.mediaRecorder = new MediaRecorder(this.#media.canvasStream);
    this.#media.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        if (!this.#media) return error(this.#error, "Media is not initialized");
        if (!this.#media.recordedChunks) this.#media.recordedChunks = [];
        this.#media.recordedChunks.push(e.data);
      }
    };
    if (!this.#media.mediaRecorder)
      return error(this.#error, "mediaRecorder is required");
    this.#media.mediaRecorder.start();

    // Start timer
    this.#media.recordTime = document.getElementById("p-record-time");
    if (!this.#media.recordTime)
      return error(this.#error, "recordTime is required");
    if (!this.#media.recordTime)
      return error(this.#error, "recordTime is required");
    this.#media.recordTime.style.display = "inline";
    let seconds = 0;
    this.#media.recordTimer = window.setInterval(() => {
      seconds++;
      if (!this.#media) return error(this.#error, "recordTime is required");
      if (!this.#media.recordTime)
        return error(this.#error, "recordTime is required");
      if (seconds >= 60) {
        this.stopRecording();
      }
      this.#media.recordTime.textContent = `${Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
    }, 1000);
  }
  // 停止录像
  async stopRecording() {
    if (!this.#media) return error(this.#error, "Media is not initialized");
    if (!this.#media.mediaRecorder)
      return error(this.#error, "mediaRecorder is required");
    this.#media.mediaRecorder.onstop = () => {
      if (!this.#media) return error(this.#error, "Media is not initialized");
      const blob = new Blob(this.#media.recordedChunks, {
        type: "video/webm",
      });
      if (this.#watch && this.#watch["record"])
        this.#watch["record"](blobToFile(blob, "mp4"));
      if (!this.#media.recordTime || !this.#media.recordTimer)
        return error(this.#error, "recordTime is required");
      clearInterval(this.#media.recordTimer);
      this.#media.recordTime.textContent = "00:00";
    };
    this.#media.mediaRecorder.stop();
  }

  handleWatermark() {
    if (!this.#media) return error(this.#error, "media is required");
    if (!this.#btns) return error(this.#error, "btns is required");
    if (!this.#btns.watermarkBtn)
      return error(this.#error, "watermarkBtn is required");
    if (
      this.#media.isWatermarkVisible === null ||
      this.#media.isWatermarkVisible === undefined
    ) {
      this.#media.isWatermarkVisible = true;
    }
    this.#media.isWatermarkVisible = !this.#media.isWatermarkVisible;
    this.#btns.watermarkBtn.textContent = this.#media.isWatermarkVisible
      ? "关闭水印"
      : "打开水印";
  }

  handleCapture() {
    this.capture();
  }

  async handleRecording() {
    if (!this.#btns) return error(this.#error, "btns is required");
    if (!this.#btns.recordBtn)
      return error(this.#error, "recordBtn is required");
    if (this.#btns.recordBtn.textContent === "录制") {
      this.startRecording();
      this.#btns.recordBtn.textContent = "停止";
    } else {
      await this.stopRecording();
      this.#btns.recordBtn.textContent = "录制";
    }
  }

  destroy() {
    if (!this.#media) return error(this.#error, "media is required");
    if (!this.#config) return error(this.#error, "config is required");
    if (!this.#config.el) return error(this.#error, "el is required");
    if (this.#media.animationFrameId) {
      cancelAnimationFrame(this.#media.animationFrameId);
    }
    if (!this.#media.mediaStream)
      return error(this.#error, "mediaStream is required");
    this.#media.mediaStream.getTracks().forEach((track: any) => track.stop());
    this.#config.el.innerHTML = "";
    if (this.#btns) {
      if (this.#config.watermark && this.#config.watermark.visible) {
        this.#btns.watermarkBtn?.removeEventListener(
          "click",
          this.handleWatermark
        );
      }
      this.#btns.captureBtn?.removeEventListener("click", this.handleCapture);
      this.#btns.recordBtn?.removeEventListener("click", this.handleRecording);
    }
  }
}

export default pCameraH5;
