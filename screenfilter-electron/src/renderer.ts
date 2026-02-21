import sharp from 'sharp';
import  {screen } from "electron";



// renderer.js
const { ipcRenderer } = require('electron');

<<<<<<< HEAD
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
=======
  let lastPngCallTime = 0;
  let intervals: number[] = [];
  // Settings and initial state for the censoring algorithm.
  let censorCtx: CensorContext = {
    history: [],
    ring_start: 0,
    ring_size: 10
  };
>>>>>>> 590d0c588cf6b7a3c2c98c4a6b0109ba3d138325

// Get accurate dimensions from main process (handles Retina/HiDPI correctly)
// @ts-ignore
ipcRenderer.once('screen-bounds', (_event, bounds) => {
  screenWidth = bounds.width;
  screenHeight = bounds.height;
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

    setInterval(() => {
      // @ts-ignore
      capture.grabFrame().then((bitmap) => {
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        // @ts-ignore
        ctx.drawImage(bitmap, 0, 0);
        document.getElementsByTagName("img")[0].src = canvas.toDataURL('image/png');
      })
    }, 1);


    // NOTE: This stream object is where you can
    // get the actual frame data
  }).catch(e => console.log(e))
}