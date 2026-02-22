fn main() {
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap();
    if target_os != "windows" && target_os != "macos" {
        panic!(
            "flashfilter only supports Windows and macOS. \
             Current target OS: `{}`. \
             Linux and other platforms are not supported.",
            target_os
        );
    }
}
