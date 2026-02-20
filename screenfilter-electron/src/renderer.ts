// renderer.js
navigator.mediaDevices.getDisplayMedia({
  audio: true,
  video: {
    width: 320,
    height: 240,
    frameRate: 30
  }
}).then(stream => {
  // NOTE: This stream object is where you can
  // get the actual frame data 
}).catch(e => console.log(e))