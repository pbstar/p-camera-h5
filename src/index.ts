import { CameraOptions, Media, Record } from "./types";
import { elTemplate } from "./constants";
import { setupCamera } from "./media";
import { base64ToFile, blobToFile, deepMerge, error } from "./utils";

class pCameraH5 {
  #config: CameraOptions;
  #media: Media = {};
  #record: Record = {};
  capture: Function;
  startRecording: Function;
  stopRecording: Function;
  destroy: Function;
  constructor(options: CameraOptions) {
    const config = {
      el: null,
      facingMode: "environment", // "user" | "environment"
      isAudio: false,
      isMirror: false,
      watermark: [
        {
          x: 10,
          y: 28,
          text: "p-camera-h5",
        },
      ],
    };
    this.#config = deepMerge(config, options);
    this.#init();
    // 拍照
    this.capture = () => {
      return new Promise((resolve, reject) => {
        if (!this.#media.canvas) return console.error("请先初始化");
        const img = this.#media.canvas.toDataURL("image/png");
        resolve(base64ToFile(img, "png"));
      });
    };
    // 开始录像
    this.startRecording = () => {
      if (this.#record.recorder) return console.error("已在录像");
      this.#record.chunks = [];
      if (!this.#media.canvasStream) return console.error("请先初始化");
      this.#record.recorder = new MediaRecorder(this.#media.canvasStream);
      this.#record.recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          if (!this.#record.chunks) this.#record.chunks = [];
          this.#record.chunks.push(e.data);
        }
      };
      this.#record.recorder.start();
    };
    // 停止录像
    this.stopRecording = () => {
      return new Promise((resolve, reject) => {
        if (!this.#record.recorder) return console.error("未开始录像");
        this.#record.recorder.onstop = () => {
          const blob = new Blob(this.#record.chunks, {
            type: "video/webm",
          });
          resolve(blobToFile(blob, "mp4"));
        };
        this.#record.recorder.stop();
        this.#record.recorder = null;
      });
    };
    // 销毁
    this.destroy = () => {
      if (!this.#config.el) return console.error("请先初始化");
      // 停止动画帧
      if (this.#media.animationFrameId) {
        cancelAnimationFrame(this.#media.animationFrameId);
        this.#media.animationFrameId = null;
      }
      // 停止并清理媒体流
      if (this.#media.mediaStream) {
        this.#media.mediaStream
          .getTracks()
          .forEach((track: any) => track.stop());
        this.#media.mediaStream = null;
      }
      // 停止并清理画布流
      if (this.#media.canvasStream) {
        this.#media.canvasStream
          .getTracks()
          .forEach((track: any) => track.stop());
        this.#media.canvasStream = null;
      }
      // 停止录像器
      if (this.#record.recorder) {
        this.#record.recorder.stop();
        this.#record.recorder = null;
      }
      // 清理画布
      if (this.#media.canvas) {
        this.#media.canvas = null;
      }
      // 清理视频元素
      if (this.#media.video) {
        this.#media.video = null;
      }
      // 清理在 createProcessedStream 中创建的 video 元素
      if (this.#media.processedVideo) {
        this.#media.processedVideo.srcObject = null;
        this.#media.processedVideo = null;
      }
      // 清空容器
      this.#config.el.innerHTML = "";
    };
  }
  // 初始化
  async #init() {
    if (!this.#config.el) return console.error("el is required");
    this.#config.el.innerHTML = elTemplate;
    this.#media.width = this.#config.el.clientWidth;
    this.#media.height = this.#config.el.clientHeight;
    this.#media.dpr = window.devicePixelRatio || 1;
    const loading = document.getElementById("p-loading") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    const video = document.getElementById("p-video") as HTMLVideoElement;
    this.#media.canvas = canvas;
    this.#media.video = video;
    loading.style.display = "block";
    await setupCamera(this.#media, this.#config);
    loading.style.display = "none";
  }
}

export default pCameraH5;
