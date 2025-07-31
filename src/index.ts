import { CameraOptions, Media } from "./types";
import { elTemplate } from "./constants";
import { setupCamera } from "./media";
import { base64ToFile, blobToFile, deepMerge, error } from "./utils";

class pCameraH5 {
  #config: CameraOptions;
  #media: Media | null;
  constructor(options: CameraOptions) {
    const config = {
      el: null,
      facingMode: "environment", // "user" | "environment"
      isAudio: false,
      watermark: [
        {
          x: 10,
          y: 10,
          text: {
            value: "p-camera-h5",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 16,
          },
        },
      ],
    };
    this.#config = deepMerge(config, options);
    this.#media = {};
    this.#init();
  }

  async #init() {
    if (!this.#config.el) return console.error("el is required");
    this.#config.el.innerHTML = elTemplate;
    const loading = document.getElementById("p-loading") as HTMLDivElement;
    loading.style.display = "block";
    await setupCamera(this.#media, this.#config);
    loading.style.display = "none";
  }

  // 拍照
  capture() {
    if (!this.#media) return error("Media is not initialized");
    if (!this.#media.canvasCtx) return error("Canvas未初始化");
    if (!this.#media.video) return error("Video未初始化");
    const canvas = document.createElement("canvas");
    canvas.width = this.#media.video.videoWidth;
    canvas.height = this.#media.video.videoHeight;
    const ctx: any = canvas.getContext("2d");
    ctx.drawImage(this.#media.canvasCtx.canvas, 0, 0);
    return base64ToFile(canvas.toDataURL("image/png"), "png");
  }
  // 开始录像
  startRecording() {
    if (!this.#media) return error("Media is not initialized");
    this.#media.recordedChunks = [];
    if (!this.#media.canvasStream) return error("canvasStream is required");
    this.#media.mediaRecorder = new MediaRecorder(this.#media.canvasStream);
    this.#media.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        if (!this.#media) return error("Media is not initialized");
        if (!this.#media.recordedChunks) this.#media.recordedChunks = [];
        this.#media.recordedChunks.push(e.data);
      }
    };
    if (!this.#media.mediaRecorder) return error("mediaRecorder is required");
    this.#media.mediaRecorder.start();

    // Start timer
    this.#media.recordTime = document.getElementById("p-record-time");
    if (!this.#media.recordTime) return error("recordTime is required");
    if (!this.#media.recordTime) return error("recordTime is required");
    this.#media.recordTime.style.display = "inline";
    let seconds = 0;
    this.#media.recordTimer = window.setInterval(() => {
      seconds++;
      if (!this.#media) return error("recordTime is required");
      if (!this.#media.recordTime) return error("recordTime is required");
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
    return new Promise((resolve, reject) => {
      if (!this.#media) return error("Media is not initialized");
      if (!this.#media.mediaRecorder) return error("mediaRecorder is required");
      this.#media.mediaRecorder.onstop = () => {
        if (!this.#media) return error("Media is not initialized");
        const blob = new Blob(this.#media.recordedChunks, {
          type: "video/webm",
        });
        resolve(blobToFile(blob, "mp4"));
        if (!this.#media.recordTime || !this.#media.recordTimer)
          return error("recordTime is required");
        clearInterval(this.#media.recordTimer);
        this.#media.recordTime.textContent = "00:00";
      };
      this.#media.mediaRecorder.stop();
    });
  }

  destroy() {
    if (!this.#media) return error("media is required");
    if (!this.#config) return error("config is required");
    if (!this.#config.el) return error("el is required");
    if (this.#media.animationFrameId) {
      cancelAnimationFrame(this.#media.animationFrameId);
    }
    if (!this.#media.mediaStream) return error("mediaStream is required");
    this.#media.mediaStream.getTracks().forEach((track: any) => track.stop());
    this.#config.el.innerHTML = "";
  }
}

export default pCameraH5;
