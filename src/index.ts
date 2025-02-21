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
    <div class="top">
      <div class="tleft">
      </div>
      <div class="tcenter">
      </div>
      <div class="tright">
        <button id="p-watermark-btn">关闭水印</button>
      </div>
    </div>
    <div class="center">
      <video id="p-video" autoplay playsinline></video>
      <div id="p-watermark"></div>
    </div>
    <div class="bottom">
      <div class="bleft">
      </div>
      <div class="bcenter">
        <button id="p-capture-btn">拍照</button>
        <button id="p-record-btn">录制</button>
      </div>
      <div class="bright">
      </div>
    </div>
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
    this.#watermarkBtn = null;
    this.#captureBtn = null;
    this.#recordBtn = null;
    this.init();
  }

  async init() {
    this.setupUI();
    this.setupBtns();
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
  setupBtns() {
    this.#watermarkBtn = document.getElementById(
      "p-watermark-btn"
    ) as HTMLButtonElement;
    this.#captureBtn = document.getElementById(
      "p-capture-btn"
    ) as HTMLButtonElement;
    this.#recordBtn = document.getElementById(
      "p-record-btn"
    ) as HTMLButtonElement;
    if (!this.#captureBtn || !this.#recordBtn) {
      throw new Error("captureBtn or recordBtn is not initialized");
    }
    if (!this.#watermarkBtn) {
      throw new Error("watermarkBtn is not initialized");
    }
    this.#watermarkBtn.addEventListener("click", () => {
      if (this.#watermark && this.#watermarkBtn) {
        this.#watermark.style.display =
          this.#watermark.style.display === "none" ? "block" : "none";
        this.#watermarkBtn.textContent =
          this.#watermark.style.display === "none" ? "打开水印" : "关闭水印";
      }
    });
    this.#captureBtn.addEventListener("click", () => {
      this.downloadRecording(this.capture(), "png");
    });
    this.#recordBtn.addEventListener("click", () => {
      if (this.#recordBtn) {
        if (this.#recordBtn.textContent === "录制") {
          this.startRecording();
          this.#recordBtn.textContent = "停止";
        } else {
          this.stopRecording().then((res:any) => {
            this.downloadRecording(res, "mp4");
          });
          this.#recordBtn.textContent = "录制";
        }
      }
    });
  }
  async setupCamera() {
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

  setupWatermark() {
    if (!this.#config.watermark.text && !this.#config.watermark.image)
      throw new Error("watermark text or image is required");
    this.#watermark = document.getElementById("p-watermark") as HTMLDivElement;
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
    debugger
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
  downloadRecording(url: string, type: string) {
    const a = document.createElement("a");
    a.href = url;
    if (type == "mp4") {
      a.download = `recording-${Date.now()}.mp4`;
    } else if (type == "webm") {
      a.download = `recording-${Date.now()}.webm`;
    } else if (type == "png") {
      a.download = `recording-${Date.now()}.png`;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
