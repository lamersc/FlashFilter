use std::sync::mpsc::{sync_channel, Receiver, SyncSender};

use screencapturekit::{
    cm_sample_buffer::CMSampleBuffer,
    cv_pixel_buffer::CVPixelBufferLockFlags,
    sc_content_filter::{InitParamWithDisplay, SCContentFilter},
    sc_shareable_content::SCShareableContent,
    sc_stream::SCStream,
    sc_stream_configuration::{PixelFormat, SCStreamConfiguration},
    sc_stream_output::{SCStreamOutput, SCStreamOutputType},
};
use winit::window::Window;

use super::{Frame, FrameCapture};

// ---------------------------------------------------------------------------
// Frame callback handler
// ---------------------------------------------------------------------------

struct CaptureHandler {
    tx:     SyncSender<Frame>,
    width:  u32,
    height: u32,
}

impl SCStreamOutput for CaptureHandler {
    fn did_output_sample_buffer(
        &self,
        sample: CMSampleBuffer,
        _output_type: SCStreamOutputType,
    ) {
        let Some(pixel_buffer) = sample.get_image_buffer() else { return };
        let Ok(guard) = pixel_buffer.lock(CVPixelBufferLockFlags::READ_ONLY) else { return };

        let bytes_per_row = guard.bytes_per_row();
        let raw = guard.as_slice();

        let width  = self.width  as usize;
        let height = self.height as usize;

        // Copy each row respecting the stride, converting BGRA → RGBA.
        let mut data = Vec::with_capacity(width * height * 4);
        for row in 0..height {
            let row_start = row * bytes_per_row;
            let row_bytes = &raw[row_start..row_start + width * 4];
            for pixel in row_bytes.chunks_exact(4) {
                // ScreenCaptureKit BGRA layout: [B, G, R, A]
                data.push(pixel[2]); // R
                data.push(pixel[1]); // G
                data.push(pixel[0]); // B
                data.push(pixel[3]); // A
            }
        }

        let _ = self.tx.try_send(Frame {
            data,
            width:  self.width,
            height: self.height,
        });
    }
}

// ---------------------------------------------------------------------------
// Public capture type
// ---------------------------------------------------------------------------

pub struct ScreenCapture {
    // Keep the stream alive for as long as the capture is running.
    _stream: SCStream,
    rx:      Receiver<Frame>,
}

impl ScreenCapture {
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let content = SCShareableContent::get()?;
        let display = content
            .displays()
            .into_iter()
            .next()
            .ok_or("no display found")?;

        let width  = display.get_width()  as u32;
        let height = display.get_height() as u32;

        // Capture the entire display; no window exclusions are specified here
        // because our overlay sets NSWindowSharingNone (see setup_window), so
        // it will not appear in the captured frames anyway.
        let filter = SCContentFilter::new(InitParamWithDisplay { display: &display });

        let config = SCStreamConfiguration::new()
            .set_width(width as usize)
            .set_height(height as usize)
            .set_pixel_format(PixelFormat::BGRA);

        let (tx, rx) = sync_channel(1);
        let handler  = CaptureHandler { tx, width, height };

        let mut stream = SCStream::new(&filter, config, None);
        stream.add_output_handler(handler, SCStreamOutputType::Screen);
        stream.start_capture()?;

        Ok(Self { _stream: stream, rx })
    }
}

impl FrameCapture for ScreenCapture {
    fn capture(&mut self) -> Option<Frame> {
        self.rx.try_recv().ok()
    }
}

// ---------------------------------------------------------------------------
// Window setup
// ---------------------------------------------------------------------------

/// Apply macOS-specific window properties via the Objective-C runtime:
///   • setIgnoresMouseEvents  — input passes through the window
///   • setSharingType: 0      — NSWindowSharingNone, invisible to capture APIs
///   • setCollectionBehavior  — visible on all Spaces / full-screen apps
pub fn setup_window(window: &Window) {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;
    use raw_window_handle::HasWindowHandle;

    let Ok(handle) = window.window_handle() else { return };
    let raw_window_handle::RawWindowHandle::AppKit(h) = handle.as_raw() else { return };

    unsafe {
        // raw_window_handle 0.6 gives us the NSView pointer.
        let ns_view: *mut AnyObject = h.ns_view.as_ptr().cast();
        let ns_window: *mut AnyObject = msg_send![ns_view, window];
        if ns_window.is_null() {
            return;
        }

        // Pass all mouse and keyboard events straight through.
        let _: () = msg_send![ns_window, setIgnoresMouseEvents: true];

        // Prevent our overlay from appearing in screenshots / recordings.
        // NSWindowSharingNone = 0
        let _: () = msg_send![ns_window, setSharingType: 0u32];

        // NSWindowCollectionBehaviorCanJoinAllSpaces (1 << 3) |
        // NSWindowCollectionBehaviorTransient        (1 << 5)
        let behavior: u32 = (1 << 3) | (1 << 5);
        let _: () = msg_send![ns_window, setCollectionBehavior: behavior];
    }
}
