import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import Logger from './logger.js';
import WarpController from './warpController.js';
import { ConnectionState, InstallationStep } from './models/enums.js';

const CLOUDFLARE_ICON_DATA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><rect width="512" height="512" rx="15%" fill="#ffffff00"/><path fill="#fff" d="M331 326c11-26-4-38-19-38l-148-2c-4 0-4-6 1-7l150-2c17-1 37-15 43-33 0 0 10-21 9-24a97 97 0 0 0-187-11c-38-25-78 9-69 46-48 3-65 46-60 72 0 1 1 2 3 2h274c1 0 3-1 3-3z"/><path fill="#fff" d="M381 224c-4 0-6-1-7 1l-5 21c-5 16 3 30 20 31l32 2c4 0 4 6-1 7l-33 1c-36 4-46 39-46 39 0 2 0 3 2 3h113l3-2a81 81 0 0 0-78-103"/></g></svg>`;
const CLOUDFLARE_ICON_DATA_INACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><rect width="512" height="512" rx="15%" fill="#ffffff00"/><path fill="#808080" d="M331 326c11-26-4-38-19-38l-148-2c-4 0-4-6 1-7l150-2c17-1 37-15 43-33 0 0 10-21 9-24a97 97 0 0 0-187-11c-38-25-78 9-69 46-48 3-65 46-60 72 0 1 1 2 3 2h274c1 0 3-1 3-3z"/><path fill="#808080" d="M381 224c-4 0-6-1-7 1l-5 21c-5 16 3 30 20 31l32 2c4 0 4 6-1 7l-33 1c-36 4-46 39-46 39 0 2 0 3 2 3h113l3-2a81 81 0 0 0-78-103"/></g></svg>`;

export const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('WARP Indicator'));
        this._controller = new WarpController();
        this._createCustomIcon();
        this._buildUI();
        this._connectSignals();
        
        this._currentState = ConnectionState.DISCONNECTED;
        
        this._controller.checkStatus();
    }
    
    _createCustomIcon() {
        this._activeIcon = this._createIconFromSVG(CLOUDFLARE_ICON_DATA);
        this._inactiveIcon = this._createIconFromSVG(CLOUDFLARE_ICON_DATA_INACTIVE);
        this._currentIcon = this._inactiveIcon;
    }
    
    _createIconFromSVG(svgData) {
        const bytes = new GLib.Bytes(svgData);
        return new Gio.BytesIcon({ bytes });
    }
    
    _buildUI() {
        this._icon = new St.Icon({
            gicon: this._currentIcon,
            icon_size: 48
        });
        this.add_child(this._icon);
        
        const container = new St.BoxLayout({
            vertical: true,
            style_class: 'warp-container'
        });
        
        this._titleLabel = new St.Label({
            text: 'WARP',
            style_class: 'warp-title-label',
            x_align: Clutter.ActorAlign.CENTER
        });
        container.add_child(this._titleLabel);
        
        this._switchButton = new St.Button({
            style_class: 'warp-switch-button',
            x_align: Clutter.ActorAlign.CENTER,
            can_focus: true,
            track_hover: true,
            reactive: true
        });
        
        this._switchContainer = new St.Bin({
            style_class: 'warp-switch-container',
            x_align: Clutter.ActorAlign.CENTER
        });
        
        this._switchTrack = new St.BoxLayout({
            style_class: 'warp-switch-track'
        });
        
        this._switchHandle = new St.Bin({
            style_class: 'warp-switch-handle'
        });
        
        this._switchTrack.add_child(this._switchHandle);
        this._switchContainer.set_child(this._switchTrack);
        this._switchButton.set_child(this._switchContainer);
        
        container.add_child(this._switchButton);
        
        
        this._installButton = new St.Button({
            label: 'Install WARP',
            style_class: 'warp-install-button',
            x_align: Clutter.ActorAlign.CENTER,
            can_focus: true,
            track_hover: true,
            reactive: true,
            visible: false
        });
        container.add_child(this._installButton);
        
        
        this._installProgressContainer = new St.BoxLayout({
            vertical: true,
            style_class: 'warp-progress-container',
            visible: false,
            x_align: Clutter.ActorAlign.CENTER
        });
        
        this._installProgressLabel = new St.Label({
            text: 'Installing...',
            style_class: 'warp-progress-label',
            x_align: Clutter.ActorAlign.CENTER
        });
        this._installProgressContainer.add_child(this._installProgressLabel);
        
        
        this._progressBarContainer = new St.Bin({
            style_class: 'warp-progress-bar-container',
            x_align: Clutter.ActorAlign.FILL,
            y_align: Clutter.ActorAlign.CENTER
        });
        
        this._progressBarBg = new St.BoxLayout({
            style_class: 'warp-progress-bar-bg'
        });
        
        this._progressBarFill = new St.BoxLayout({
            style_class: 'warp-progress-bar-fill',
            width: 0
        });
        
        this._progressBarBg.add_child(this._progressBarFill);
        this._progressBarContainer.set_child(this._progressBarBg);
        this._installProgressContainer.add_child(this._progressBarContainer);
        
        this._installProgressDetail = new St.Label({
            text: '',
            style_class: 'warp-progress-detail',
            x_align: Clutter.ActorAlign.CENTER
        });
        this._installProgressContainer.add_child(this._installProgressDetail);
        
        container.add_child(this._installProgressContainer);
        
        this._statusLabel = new St.Label({
            text: 'Disconnected',
            style_class: 'warp-status-label',
            x_align: Clutter.ActorAlign.CENTER
        });
        container.add_child(this._statusLabel);
        
        this._privacyLabel = new St.Label({
            text: 'Your Internet is not private.',
            style_class: 'warp-privacy-label',
            x_align: Clutter.ActorAlign.CENTER
        });
        container.add_child(this._privacyLabel);
        
        this.menu.actor.add_style_class_name('warp-popup-menu');
        this.menu.box.add_style_class_name('warp-popup-menu-box');
        
        const menuItem = new PopupMenu.PopupBaseMenuItem({
            style_class: 'warp-popup-container',
            activate: false,
            hover: false,
            can_focus: false
        });
        
        menuItem.remove_style_class_name('popup-menu-item');
        menuItem.add_child(container);
        
        this.menu.addMenuItem(menuItem);
    }
    
    _connectSignals() {
        this._switchButtonSignal = this._switchButton.connect('clicked', () => {
            this._toggleConnection();
        });
        
        this._installButton.connect('clicked', () => {
            this._installWarp();
        });
        
        this._controller.addStateChangedCallback(this._handleStateChanged.bind(this));
        this._controller.addInstallStepCallback(this._handleInstallStepChanged.bind(this));
    }
    
    _toggleConnection() {
        if (this._controller.state === ConnectionState.CONNECTED) {
            Logger.info('User requested disconnect');
            this._controller.disconnect();
        } else if (this._controller.state === ConnectionState.DISCONNECTED) {
            Logger.info('User requested connect');
            this._controller.connect();
        }
    }
    
    _installWarp() {
        Logger.info('User requested installation');
        
        this._switchButton.visible = false;
        this._installButton.visible = false;
        this._installProgressContainer.visible = true;
        this._statusLabel.visible = false;
        this._privacyLabel.visible = false;
        this._progressBarFill.width = 0;
        
        this._installProgressLabel.text = 'Preparing...';
        this._installProgressDetail.text = 'Starting Cloudflare WARP installation';
        
        this._controller.installWarp();
    }
    
    _handleInstallStepChanged(step, progress) {
        Logger.debug(`Installation step changed: ${step} (${progress}%)`);
        
        this._installProgressContainer.visible = true;
        this._installButton.visible = false;
        this._switchButton.visible = false;
        this._statusLabel.visible = false;
        this._privacyLabel.visible = false;
        
        const maxWidth = 180;
        const fillWidth = Math.floor((maxWidth * progress) / 100);
        this._progressBarFill.width = fillWidth;
        
        this._progressBarFill.queue_relayout();
        
        let statusText = '';
        let detailText = '';
        
        switch (step) {
            case InstallationStep.CHECKING_DEPS:
                statusText = 'Checking dependencies...';
                detailText = 'Verifying required system commands';
                break;
                
            case InstallationStep.DETECTING_DISTRO:
                statusText = 'Detecting system...';
                detailText = 'Identifying your Linux distribution';
                break;
                
            case InstallationStep.REQUESTING_SUDO:
                statusText = 'Requesting permissions...';
                detailText = 'Administrator access is required';
                break;
                
            case InstallationStep.ADDING_REPO:
                statusText = 'Setting up repositories...';
                detailText = 'Adding Cloudflare package repository';
                break;
                
            case InstallationStep.INSTALLING_PACKAGE:
                statusText = 'Installing WARP...';
                detailText = 'Downloading and installing Cloudflare WARP';
                break;
                
            case InstallationStep.STARTING_SERVICE:
                statusText = 'Starting service...';
                detailText = 'Configuring and starting WARP service';
                break;
                
            case InstallationStep.COMPLETED:
                statusText = 'Installation complete!';
                detailText = 'Cloudflare WARP was installed successfully';
                
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                    this._handleStateChanged(ConnectionState.DISCONNECTED);
                    
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                        this._reconnectSwitchButton();
                        Logger.debug('Switch button forcibly reconnected after installation');
                        return GLib.SOURCE_REMOVE;
                    });
                    
                    return GLib.SOURCE_REMOVE;
                });
                break;
                
            case InstallationStep.FAILED:
                statusText = 'Installation failed';
                detailText = 'An error occurred during installation';
                
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                    this._handleStateChanged(ConnectionState.NOT_INSTALLED);
                    return GLib.SOURCE_REMOVE;
                });
                break;
                
            default:
                statusText = 'Installing...';
                detailText = '';
                break;
        }
        
        this._installProgressLabel.text = statusText;
        this._installProgressDetail.text = detailText;
    }
    
    _handleStateChanged(newState) {
        Logger.debug(`Updating UI for state: ${newState}`);
        
        const previousState = this._currentState;
        this._currentState = newState;
        
        this._updateUI(newState);
        
        if ((newState === ConnectionState.CONNECTED || 
             newState === ConnectionState.DISCONNECTED) && 
            (previousState === ConnectionState.INSTALLING || 
             previousState === ConnectionState.REGISTERING)) {
            
            Logger.debug(`State transition from ${previousState} to ${newState}, reconnecting signals`);
            
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
                this._reconnectSwitchButton();
                return GLib.SOURCE_REMOVE;
            });
        }
    }
    
    _reconnectSwitchButton() {
        Logger.debug('Reconnecting switch button signals');
        
        if (this._switchButtonSignal) {
            this._switchButton.disconnect(this._switchButtonSignal);
            this._switchButtonSignal = null;
        }
        
        this._switchButtonSignal = this._switchButton.connect('clicked', () => {
            Logger.debug('Switch button clicked');
            this._toggleConnection();
        });
        
        this._switchButton.reactive = true;
        this._switchButton.can_focus = true;
        this._switchButton.track_hover = true;
        
        Logger.debug('Switch button signals reconnected');
    }
    
    _updateUI(state) {
        switch (state) {
            case ConnectionState.CONNECTED:
                this._icon.gicon = this._activeIcon;
                this._titleLabel.style_class = 'warp-title-label warp-title-connected';
                this._statusLabel.text = 'Connected';
                this._privacyLabel.text = 'Your Internet is private.';
                this._switchTrack.style_class = 'warp-switch-track warp-switch-active';
                this._switchHandle.style_class = 'warp-switch-handle warp-switch-handle-active';
                this._switchButton.visible = true;
                this._installButton.visible = false;
                this._installProgressContainer.visible = false;
                this._statusLabel.visible = true;
                this._privacyLabel.visible = true;
                
                this._switchButton.reactive = true;
                this._switchButton.can_focus = true;
                this._switchButton.track_hover = true;
                break;
                
            case ConnectionState.CONNECTING:
                this._icon.gicon = this._inactiveIcon;
                this._titleLabel.style_class = 'warp-title-label';
                this._statusLabel.text = 'Connecting...';
                this._privacyLabel.text = 'Securing your connection...';
                this._switchTrack.style_class = 'warp-switch-track';
                this._switchHandle.style_class = 'warp-switch-handle';
                this._switchButton.visible = true;
                this._installButton.visible = false;
                this._installProgressContainer.visible = false;
                this._statusLabel.visible = true;
                this._privacyLabel.visible = true;
                
                this._switchButton.reactive = true;
                this._switchButton.can_focus = true;
                this._switchButton.track_hover = true;
                break;
                
            case ConnectionState.REGISTERING:
                this._icon.gicon = this._inactiveIcon;
                this._titleLabel.style_class = 'warp-title-label';
                this._statusLabel.text = 'Registering...';
                this._privacyLabel.text = 'Setting up your WARP account...';
                this._switchTrack.style_class = 'warp-switch-track';
                this._switchHandle.style_class = 'warp-switch-handle';
                this._switchButton.visible = true;
                this._installButton.visible = false;
                this._installProgressContainer.visible = false;
                this._statusLabel.visible = true;
                this._privacyLabel.visible = true;
                
                this._switchButton.reactive = false;
                this._switchButton.can_focus = false;
                this._switchButton.track_hover = false;
                break;
                
            case ConnectionState.INSTALLING:
                this._icon.gicon = this._inactiveIcon;
                this._titleLabel.style_class = 'warp-title-label';
                this._switchButton.visible = false;
                this._installButton.visible = false;
                this._statusLabel.visible = false;
                this._privacyLabel.visible = false;
                this._installProgressContainer.visible = true;
                this._progressBarFill.width = 0;
                if (!this._installProgressLabel.text) {
                    this._installProgressLabel.text = 'Starting installation...';
                }
                if (!this._installProgressDetail.text) {
                    this._installProgressDetail.text = 'Preparing to install Cloudflare WARP';
                }
                break;
                
            case ConnectionState.ERROR:
                this._icon.gicon = this._inactiveIcon;
                this._titleLabel.style_class = 'warp-title-label';
                this._statusLabel.text = 'Error';
                this._privacyLabel.text = 'Connection error occurred.';
                this._switchTrack.style_class = 'warp-switch-track';
                this._switchHandle.style_class = 'warp-switch-handle';
                this._switchButton.visible = true;
                this._installButton.visible = false;
                this._installProgressContainer.visible = false;
                this._statusLabel.visible = true;
                this._privacyLabel.visible = true;
                
                this._switchButton.reactive = true;
                this._switchButton.can_focus = true;
                this._switchButton.track_hover = true;
                break;
                
            case ConnectionState.NOT_INSTALLED:
                this._icon.gicon = this._inactiveIcon;
                this._titleLabel.style_class = 'warp-title-label';
                this._statusLabel.text = 'Not Installed';
                this._privacyLabel.text = 'Cloudflare WARP is not installed.';
                this._switchButton.visible = false;
                this._installButton.visible = true;
                this._installProgressContainer.visible = false;
                this._statusLabel.visible = true;
                this._privacyLabel.visible = true;
                break;
                
            case ConnectionState.DISCONNECTED:
            default:
                this._icon.gicon = this._inactiveIcon;
                this._titleLabel.style_class = 'warp-title-label';
                this._statusLabel.text = 'Disconnected';
                this._privacyLabel.text = 'Your Internet is not private.';
                this._switchTrack.style_class = 'warp-switch-track';
                this._switchHandle.style_class = 'warp-switch-handle';
                this._switchButton.visible = true;
                this._installButton.visible = false;
                this._installProgressContainer.visible = false;
                this._statusLabel.visible = true;
                this._privacyLabel.visible = true;
                
                this._switchButton.reactive = true;
                this._switchButton.can_focus = true;
                this._switchButton.track_hover = true;
                break;
        }
    }
    
    startPeriodicChecks(interval = 5) {
        this._checkStatusTimeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            interval,
            () => {
                try {
                    Logger.debug('Running periodic status check');
                    this._controller.checkStatus();
                } catch (e) {
                    Logger.error(`Error in periodic check: ${e.message}`);
                }
                return true;
            }
        );
        
        return this._checkStatusTimeoutId;
    }
    
    stopPeriodicChecks() {
        if (this._checkStatusTimeoutId) {
            GLib.source_remove(this._checkStatusTimeoutId);
            this._checkStatusTimeoutId = null;
        }
    }
    
    destroy() {
        Logger.debug('Destroying indicator');
        this.stopPeriodicChecks();
        this._controller.removeStateChangedCallback(this._handleStateChanged.bind(this));
        this._controller.removeInstallStepCallback(this._handleInstallStepChanged.bind(this));
        super.destroy();
    }
}); 