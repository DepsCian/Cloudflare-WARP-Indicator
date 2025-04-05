<div align="center">
  
  <img src="assets/header.png" alt="Cloudflare WARP Indicator" width="250" />

  # ☁️ Cloudflare WARP Indicator

  *Seamless Cloudflare WARP integration for your GNOME Shell*

  <p>
    <a href="https://extensions.gnome.org/extension/6825/cloudflare-warp-indicator/">
      <img src="https://img.shields.io/badge/GNOME_Shell-Extension-4A86CF?style=for-the-badge&logo=gnome&logoColor=white" alt="GNOME Shell Extension" />
    </a>
    <!-- <a href="https://github.com/depscian/cloudflare-warp-indicator">
      <img src="https://img.shields.io/github/stars/depscian/cloudflare-warp-indicator?style=for-the-badge&logo=github&color=yellow" alt="GitHub stars" />
    </a> -->
    <a href="https://github.com/depscian/cloudflare-warp-indicator/releases/latest">
      <img src="https://img.shields.io/github/v/release/depscian/cloudflare-warp-indicator?style=for-the-badge&logo=github&color=brightgreen" alt="Latest Release" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/GNOME-45%2B-4A86CF?style=flat-square&logo=gnome&logoColor=white" alt="GNOME 45+" />
    <img src="https://img.shields.io/badge/language-JavaScript-F7DF1E?style=flat-square&logo=javascript" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Cloudflare-WARP-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare WARP" />
    <img src="https://img.shields.io/badge/platform-Linux-FCC624?style=flat-square&logo=linux&logoColor=white" alt="Platform: Linux" />
    <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="License: MIT" />
  </p>
  
  <br />

  <p>
    <a href="#-installation">
      <img src="https://img.shields.io/badge/⚡_Quick_Install-171717?style=for-the-badge" alt="Quick Install" />
    </a>
    <a href="#-features">
      <img src="https://img.shields.io/badge/✨_Features-171717?style=for-the-badge" alt="Features" />
    </a>
    <a href="#-preview">
      <img src="https://img.shields.io/badge/📸_Screenshots-171717?style=for-the-badge" alt="Screenshots" />
    </a>
  </p>

</div>

---

## 📋 Overview

**Cloudflare WARP Indicator** supercharges your GNOME desktop with seamless integration for Cloudflare WARP zero-trust network connectivity. This sleek extension adds an elegant, feature-rich interface to your system tray, allowing you to connect, manage, and monitor your WARP connection with just a single click.

<div align="center">
  <img src="https://img.shields.io/badge/Secure-Connection-success?style=for-the-badge&logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Zero_Trust-Network-blue?style=for-the-badge&logo=shield&logoColor=white" />
  <img src="https://img.shields.io/badge/Enhanced-Privacy-purple?style=for-the-badge&logo=privacybadger&logoColor=white" />
</div>

## ✨ Features

<div align="center">
  <table>
    <tr>
      <td align="center">▶️</td>
      <td><b>One-Click Toggle</b>: Connect or disconnect with a single click</td>
    </tr>
    <tr>
      <td align="center">🎨</td>
      <td><b>Familiar UI</b>: 90% copied from the original macOS WARP GUI for seamless experience</td>
    </tr>
    <tr>
      <td align="center">📥</td>
      <td><b>Auto-Installation</b>: Can install WARP client if not already present</td>
    </tr>
    <tr>
      <td align="center">⚙️</td>
      <td><b>Low Resource Usage</b>: Minimal impact on system performance</td>
    </tr>
  </table>
</div>

## 📸 Preview

<p align="center">
  <img src="assets/preview-disconnected.png" alt="WARP Indicator Screenshot" width="300" />
  <img src="assets/preview-connected.png" alt="WARP Indicator Screenshot" width="300" />
</p>

## 🚀 Installation

Get up and running with the Cloudflare WARP Indicator in just a few clicks.

### ✨ Recommended: Install via GNOME Extensions

This is the **easiest and recommended** way to get the extension:

<div align="center" style="margin-bottom: 15px;">
  <a href="https://extensions.gnome.org/extension/6825/cloudflare-warp-indicator/">
    <img src="https://img.shields.io/badge/Install_from-GNOME_Extensions-4A86CF?style=for-the-badge&logo=gnome&logoColor=white" alt="Install from GNOME Extensions" />
  </a>
</div>

Just click the badge above and follow the instructions on the GNOME Extensions website.

<details>
<summary>🔧 Alternative: Manual Installation (for advanced users)</summary>

If you prefer installing from source:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/depscian/cloudflare-warp-indicator.git
    ```
2.  **Navigate into the directory:**
    ```bash
    cd cloudflare-warp-indicator
    ```
3.  **Run the install script:**
    ```bash
    ./install.sh
    ```
    *(Note: You might need to make the script executable first: `chmod +x install.sh`)*

</details>

<details>
<summary>✅ Prerequisites Checklist</summary>

Make sure your system is ready:

*   **GNOME Shell:** Version 45 or newer.
*   **Cloudflare WARP Client:** Must be installed. The extension can help install it if missing.
*   **GLib/Gio Libraries:** Usually included with GNOME.

</details>

## 💻 Usage

After installation, the extension is ready to use:

1. **Access**: Click the Cloudflare icon in your system tray
2. **Connect/Disconnect**: Toggle the switch to manage your WARP connection
3. **Status**: The icon and label show your current connection status
4. **First Run**: If WARP isn't detected, the extension will offer to install it for you

## 🛠️ Development

Interested in contributing or modifying the extension? Here's how to get started:

### Technology Stack

<div align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat-square&logo=javascript" alt="JavaScript ES6+" />
  <img src="https://img.shields.io/badge/GNOME_Shell-API-4A86CF?style=flat-square&logo=gnome" alt="GNOME Shell API" />
  <img src="https://img.shields.io/badge/GJS-Bindings-4A86CF?style=flat-square" alt="GJS Bindings" />
</div>

### Project Structure

The codebase is organized for clarity:

```
cloudflarewarpindicator@depscian.com/
├── models/         # Data models and enums
├── services/       # Connection and installation services
├── utils/          # Utility functions
├── extension.js    # Main extension entry point
├── indicator.js    # UI implementation
└── warpController.js # Core WARP interaction logic
```
*(Note: The actual extension files reside within the `cloudflarewarpindicator@depscian.com/` directory).* 

### Setup & Making Changes

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/depscian/cloudflare-warp-indicator.git
    cd cloudflare-warp-indicator
    ```
2.  **Edit the Code:** Modify the JavaScript files within the `cloudflarewarpindicator@depscian.com/` directory using your preferred editor.

### Testing Your Changes

To see your modifications in action:

1.  **Install Locally:** Run the installation script to copy your modified files to the GNOME Shell extensions directory:
    ```bash
    ./install.sh 
    ```
    *(This overwrites any existing installation)*
2.  **Reload GNOME Shell:** Press `Alt` + `F2`, type `r`, and press `Enter`. Alternatively, disable and re-enable the extension through the GNOME Extensions app or website.

### Debugging

For troubleshooting, you can enable debug logging. Add `const DEBUG = true;` near the top of `cloudflarewarpindicator@depscian.com/extension.js`. Logs will appear in the system journal (`journalctl /usr/bin/gnome-shell`) or potentially in `/tmp/warp-extension-debug.log` depending on the setup. Remember to remove the debug flag before committing.

## 👥 Contributing

Contributions are welcome! Feel free to submit pull requests or open issues.

<div align="center">
  <a href="https://github.com/depscian/cloudflare-warp-indicator/issues/new">
    <img src="https://img.shields.io/badge/Report_Bug-critical?style=for-the-badge&logo=github" alt="Report Bug" />
  </a>
  <a href="https://github.com/depscian/cloudflare-warp-indicator/issues/new">
    <img src="https://img.shields.io/badge/Request_Feature-blue?style=for-the-badge&logo=github" alt="Request Feature" />
  </a>
</div>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
> [!IMPORTANT]
> This extension is not affiliated, funded, or in any way associated with Cloudflare. It's an independent project designed to enhance the user experience of Cloudflare WARP on Linux.

<div align="center">
  <p>
    <a href="https://github.com/depscian/cloudflare-warp-indicator">
      <img src="https://img.shields.io/badge/Made_with_❤️_by-depscian-F38020?style=for-the-badge&logo=github&logoColor=white" alt="Made with ❤️ by depscian" />
    </a>
  </p>
  
  <!-- <p>
    <a href="https://github.com/depscian/cloudflare-warp-indicator/stargazers">
      <img src="https://img.shields.io/github/stars/depscian/cloudflare-warp-indicator?style=social" alt="Stars" />
    </a>
    •
    <a href="https://github.com/depscian/cloudflare-warp-indicator/network/members">
      <img src="https://img.shields.io/github/forks/depscian/cloudflare-warp-indicator?style=social" alt="Forks" />
    </a>
    •
    <a href="https://github.com/depscian/cloudflare-warp-indicator/watchers">
      <img src="https://img.shields.io/github/watchers/depscian/cloudflare-warp-indicator?style=social" alt="Watchers" />
    </a>
  </p> -->
</div>