import { FlashingDissolver } from './flashing-dissolver';

// renderer.js
const { ipcRenderer } = require('electron');

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let flashingDissolver: FlashingDissolver;

// Get accurate dimensions from main process (handles Retina/HiDPI correctly)
// @ts-ignore
ipcRenderer.once('screen-bounds', (_event, bounds) => {
  screenWidth = Math.floor(bounds.width / bounds.width * 720);
  screenHeight = Math.floor(bounds.height / bounds.width * 720);

  const canvas = document.querySelector('canvas')!;
  flashingDissolver = new FlashingDissolver(canvas, screenWidth, screenHeight);
  startCapture();
});

// @ts-ignore
function startCapture() {
  navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: {
      width: screenWidth,
      height: screenHeight,
      frameRate: 30
    }
  }).then(stream => {
    const videoTrack = stream.getVideoTracks()[0];
    const capture = new ImageCapture(videoTrack);

    setInterval(() => {
      // @ts-ignore
      capture.grabFrame().then((bitmap: ImageBitmap) => {
        flashingDissolver.feedFrame(bitmap);
        bitmap.close();
      }).catch((e: Error) => {
        // Frame grab can fail transiently, ignore
      });
    }, 33.3);
  }).catch(e => console.log(e));
}
