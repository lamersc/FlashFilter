import sharp from 'sharp';
import  {screen } from "electron";
import { FlashingDissolver } from './flashing-dissolver';


// renderer.js
const { ipcRenderer } = require('electron');

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;


// Get accurate dimensions from main process (handles Retina/HiDPI correctly)
// @ts-ignore
ipcRenderer.once('screen-bounds', (_event, bounds) => {
  screenWidth = bounds.width / bounds.width * 720;
  screenHeight = bounds.height / bounds.width * 720;
  startCapture();
});

// renderer.js
//@ts-ignore
function startCapture() {

  navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: {
      width: screenWidth,
      height: screenHeight,
      frameRate: 30
    }
  }).then(stream => {
    console.log(stream);
    const videoTrack = stream.getVideoTracks()[0];
    const capture = new ImageCapture(videoTrack);
    const img = document.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let lastPngCallTime = 0;
    let intervals: number[] = [];

    const video = document.querySelector('video')!;
    video.srcObject = canvas.captureStream(30); // match your target frame rate
    video.play();

    setInterval(() => {
      //@ts-ignore
      capture.grabFrame().then((bitmap: ImageBitmap) => {
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        // @ts-ignore
        ctx.drawImage(bitmap, 0, 0);

        //censor(censorCtx, bitmap, canvas);
        bitmap.close();
      })
    }, 33.3);


    // NOTE: This stream object is where you can
    // get the actual frame data
  }).catch(e => console.log(e))
}