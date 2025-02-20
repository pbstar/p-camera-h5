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
    <video id="p-camera-h5-video" autoplay playsinline></video>
    <div id="p-camera-h5-watermark" class="watermark"></div>
  </div>
`;
class pCameraH5 {
  #config: opt;
  #mediaStream: MediaStream | null;
  #mediaRecorder: MediaRecorder | null;
  #recordedChunks: Blob[];
  #video: HTMLVideoElement | null;
  #watermark: HTMLDivElement | null;
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
    if (!options.el) {
      throw new Error("el is required");
    }
    Object.assign(this.#config, options);
    this.#mediaStream = null;
    this.#mediaRecorder = null;
    this.#recordedChunks = [];
    this.#video = null;
    this.#watermark = null;
    this.init();
  }

  async init() {
    this.setupUI();
    await this.setupCamera();
    this.setupWatermark();
  }

  setupUI() {
    // 加载相机模板
    this.#config.el.innerHTML = elTemplate;
    // 加载css样式
    const styleElement = document.createElement("style");
    styleElement.innerHTML = JSON.stringify(style);
    this.#config.el.appendChild(styleElement);
  }

  async setupCamera() {
    try {
      this.#video = document.getElementById(
        "p-camera-h5-video"
      ) as HTMLVideoElement;
      this.#mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.#video.srcObject = this.#mediaStream;
    } catch (error: any) {
      throw new Error("Error accessing media devices: " + error.message);
    }
  }

  setupWatermark() {
    if (!this.#config.watermark.text && !this.#config.watermark.image)
      throw new Error("watermark text or image is required");
    this.#watermark = document.getElementById(
      "p-camera-h5-watermark"
    ) as HTMLDivElement;
    if (!this.#watermark) throw new Error("watermark is not initialized");
    Object.assign(this.#watermark.style, {
      position: "absolute",
      pointerEvents: "none",
      color: this.#config.watermark.color,
      fontSize: this.#config.watermark.fontSize,
    });

    // 计算水印位置
    const positions = this.#config.watermark.position.split("-");
    positions.forEach((p: any) => {
      if (this.#watermark) {
        this.#watermark.style[p] = "10px";
      }
    });

    if (this.#config.watermark.text) {
      this.#watermark.textContent = this.#config.watermark.text;
    } else if (this.#config.watermark.image) {
      const img = new Image();
      img.src = this.#config.watermark.image;
      this.#watermark.appendChild(img);
    }
  }

  capture() {
    if (!this.#video) throw new Error("video is not initialized");
    const canvas = document.createElement("canvas");
    canvas.width = this.#video.videoWidth;
    canvas.height = this.#video.videoHeight;
    const ctx: any = canvas.getContext("2d");
    ctx.drawImage(this.#video, 0, 0);
    return canvas.toDataURL("image/png");
  }

  startRecording() {
    this.#recordedChunks = [];
    const options = { mimeType: "video/webm" };
    if (!this.#mediaStream) throw new Error("mediaStream is not initialized");
    this.#mediaRecorder = new MediaRecorder(this.#mediaStream, options);

    this.#mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.#recordedChunks.push(e.data);
    };

    this.#mediaRecorder.start();
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.#mediaRecorder)
        throw new Error("mediaRecorder is not initialized");
      this.#mediaRecorder.onstop = () => {
        const blob = new Blob(this.#recordedChunks, { type: "video/webm" });
        resolve(URL.createObjectURL(blob));
      };
      this.#mediaRecorder.stop();
    });
  }

  destroy() {
    if (!this.#video) throw new Error("video is not initialized");
    if (!this.#mediaStream) throw new Error("mediaStream is not initialized");
    this.#mediaStream.getTracks().forEach((track) => track.stop());
    this.#config.el.removeChild(this.#video);
    if (this.#watermark) this.#config.el.removeChild(this.#watermark);
  }
}
export default pCameraH5;
