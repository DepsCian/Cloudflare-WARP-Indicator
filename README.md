# Cloudflare WARP Indicator Extension for GNOME Shell

This GNOME Shell extension adds a Cloudflare WARP connection indicator to the status area of the GNOME Shell panel. It allows users to connect to, disconnect from, and check the status of their WARP connection directly from the desktop.

## Features
- **WARP Connection Toggle:** A switch to connect or disconnect from WARP.
- **Connection Status Indicator:** An icon and label indicate the current connection status - connected, disconnected, or error.
- **Immediate Feedback:** Notifications provide immediate feedback on the success or failure of connection attempts.

## Dependencies
- `GNOME Shell 45`
- `GObject-Introspection`
- `warp-cli` - command-line tool for managing Cloudflare WARP

## Installation

#### Simple

- Install the extension from [GNOME Shell Extensions website](https://extensions.gnome.org/extension/6825/cloudflare-warp-indicator/)

#### Manually

1. Ensure you have GNOME Shell and the `warp-cli` tool installed on your system.
2. Copy the extension to your GNOME Shell extensions directory, typically `~/.local/share/gnome-shell/extensions/`.
3. Enable the extension using GNOME Extensions app.

> [!IMPORTANT]
> This extension is not affiliated, funded, or in any way associated with Cloudflare.
