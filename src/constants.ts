export const elTemplate = `
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