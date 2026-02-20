import { app, ipcMain, desktopCapturer, session,  BrowserWindow } from 'electron';

// WARN: The focusable flag that allows input passthrough only works on windows
// and MacOS.
app.on("ready", () => {
    // zwlr_layer_surface_v1::set_keyboard_interactivity is needed to
    // support input passthrough on Linux (Wayland). But even that only
    // works for WRL based Wayland compositors.
    let browserWindow = new BrowserWindow({
        frame: false,
        focusable: false, // Windows, MacOS
        transparent: true,
        // This apparently exists but my LSP complains
        // visibleOnAllWorkspaces: true, // MacOS, Linux
        alwaysOnTop: true,
    });
    browserWindow.setIgnoreMouseEvents(true);

    desktopCapturer.getSources({ types: ['screen'] }).then(sources => {
        const imageURL = sources[0].thumbnail.toDataURL();
        browserWindow.loadURL(imageURL);
    });
});