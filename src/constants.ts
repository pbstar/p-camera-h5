export const elTemplate = `
  <style>
    #p-camera-h5 {
      width: 100%;
      height: 100%;
      background-color: #000;
      position: relative;
      z-index: 100;
    }
    #p-camera-h5 #p-loading,
    #p-camera-h5 #p-error {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 20% 10%;
      color: #fff;
      background-color: #000;
      line-height: 30px;
      text-align: center;
      font-size: 16px;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 110;
      display: none;
    }
    #p-camera-h5 #p-error {
      z-index: 111;
    }
    #p-camera-h5 #p-video {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 101;
    }
  </style>
  <div id="p-camera-h5">
    <div id="p-loading">加载中...</div>
    <div id="p-error"></div>
    <video id="p-video" autoplay playsinline></video>
  </div>
`;
