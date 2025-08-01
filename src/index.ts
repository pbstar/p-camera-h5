import { CameraOptions, Media } from "./types";
import { elTemplate } from "./constants";
import { setupCamera } from "./media";
import { base64ToFile, blobToFile, deepMerge, error } from "./utils";

class pCameraH5 {
  #config: CameraOptions;
  #media: Media | null = {};
  capture: Function;
  startRecording: Function;
  stopRecording: Function;
  destroy: Function;
  constructor(options: CameraOptions) {
    const config = {
      el: null,
      facingMode: "environment", // "user" | "environment"
      isAudio: false,
      watermark: [
        {
          x: 10,
          y: 10,
          text: "p-camera-h5",
        },
      ],
    };
    this.#config = deepMerge(config, options);
    this.#init();
    // 拍照
    this.capture = () => {
      return new Promise((resolve, reject) => {
        if (!this.#media) return error("Media is not initialized");
        if (!this.#media.canvasCtx) return error("Canvas未初始化");
        if (!this.#media.video) return error("Video未初始化");
        const canvas = document.createElement("canvas");
        canvas.width = this.#media.video.videoWidth;
        canvas.height = this.#media.video.videoHeight;
        const ctx: any = canvas.getContext("2d");
        ctx.drawImage(this.#media.canvasCtx.canvas, 0, 0);
        resolve(base64ToFile(canvas.toDataURL("image/png"), "png"));
      });
    };
    // 开始录像
    this.startRecording = () => {
      if (!this.#media) return error("Media is not initialized");
      if (this.#media.recordSecond) return console.error("已在录像");
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
      this.#media.recordSecond = 0;
      this.#media.recordTimer = window.setInterval(() => {
        if (this.#media && this.#media.recordSecond !== undefined) {
          this.#media.recordSecond++;
        }
      }, 1000);
    };
    // 停止录像
    this.stopRecording = () => {
      return new Promise((resolve, reject) => {
        if (!this.#media) return error("Media is not initialized");
        if (!this.#media.mediaRecorder)
          return error("mediaRecorder is required");
        this.#media.mediaRecorder.onstop = () => {
          const blob = new Blob(this.#media?.recordedChunks, {
            type: "video/webm",
          });
          clearInterval(this.#media?.recordTimer);
          resolve(blobToFile(blob, "mp4"));
        };
        this.#media.mediaRecorder.stop();
      });
    };
    // 销毁
    this.destroy = () => {
      if (!this.#media) return error("media is required");
      if (!this.#config) return error("config is required");
      if (!this.#config.el) return error("el is required");
      if (this.#media.animationFrameId) {
        cancelAnimationFrame(this.#media.animationFrameId);
      }
      if (!this.#media.mediaStream) return error("mediaStream is required");
      this.#media.mediaStream.getTracks().forEach((track: any) => track.stop());
      this.#config.el.innerHTML = "";
    };
  }
  // 初始化
  async #init() {
    if (!this.#config.el) return console.error("el is required");
    if (!this.#media) this.#media = {};
    this.#media.width = this.#config.el.clientWidth;
    this.#media.height = this.#config.el.clientHeight;
    this.#media.dpr = window.devicePixelRatio || 1;
    this.#config.el.innerHTML = elTemplate;
    const loading = document.getElementById("p-loading") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    this.#media.canvas = canvas;
    const video = document.getElementById("p-video") as HTMLVideoElement;
    this.#media.video = video;
    loading.style.display = "block";
    await setupCamera(this.#media, this.#config);
    loading.style.display = "none";
  }
}

export default pCameraH5;
