export class FlashingDissolver {
    readonly ctx: OffscreenCanvasRenderingContext2D;
    history: ImageData[];
    captureWidth: number;
    captureHeight: number;
    pixelStates: Uint8ClampedArray;

    constructor(captureWidth: number, captureHeight: number) {
        const canvas = new OffscreenCanvas(captureWidth, captureHeight)
        const ctx = canvas.getContext("2d", {
            willReadFrequently: true
        })
        if (!ctx) throw new Error("Failed to create OffscreenCanvasRenderingContext2D");
        this.ctx = ctx;
        this.history = [];
        this.captureWidth = captureWidth;
        this.captureHeight = captureHeight;
        this.pixelStates = new Uint8ClampedArray(captureWidth * captureHeight * 3);

        setInterval(() => {

        }, 333)
    }

    feedFrame(frame: ImageBitmap) {
        if (this.history.length > 10) this.history.shift();
        this.history.push(this.ctx.getImageData(0, 0, this.captureWidth, this.captureHeight));
    }
}