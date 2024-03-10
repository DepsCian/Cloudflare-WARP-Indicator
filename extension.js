import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

let isConnected = false;

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('WARP Indicator'));
    
        this._icon = new St.Icon({
            icon_name: 'weather-overcast-symbolic',
            style_class: 'warp-disconnected',
            icon_size: 16
        });
        this.add_child(this._icon);
    
        this._buttonSwitchItem = new PopupMenu.PopupSwitchMenuItem(_(''), { status: false }, { style_class: 'warp-switch' });
        this._buttonSwitchItem.connect('toggled', () => {
            this._toggleWarpConnection();
        });
        this._label = new PopupMenu.PopupMenuItem('WARP', {style_class: 'warp-label'});
        this._isConnectedLabel = new PopupMenu.PopupMenuItem('Disconnected', {style_class: 'warp-label-status'});
        this._label.set_x_align(2);
        this.menu.addMenuItem(this._label);
        this._buttonSwitchItem.set_x_align(2);
        this.menu.addMenuItem(this._buttonSwitchItem);
        this._isConnectedLabel.set_x_align(2);
        this.menu.addMenuItem(this._isConnectedLabel);
        this._label.set_x_align(2);
        this._checkConnectionStatus();
        this._updateSwitchState();
    }
    
    _toggleWarpConnection() {
        if (isConnected) {
            this._disconnectFromWarp();
        } else {
            this._connectToWarp();
        }
    }

    /**
     * Executes a command using GLib.spawn_command_line_sync and handles any errors.
     *
     * @param {string} command - the command to be executed
     * @return {Array} an array containing success status, stdout, and stderr
     */
    _executeCommand(command) {
        try {
            let [success, stdout, stderr] = GLib.spawn_command_line_sync(command);
            return [success, stdout.toString().trim(), stderr.toString().trim()];
        } catch (e) {
            Main.notify(`Error executing command: ${e.message}`);
            return [false, '', 'Error executing command'];
        }
    }

    _connectToWarp() {
        let [connectSuccess, connectStderr] = this._executeCommand('warp-cli connect');

        if (connectSuccess) {
            GLib.timeout_add_seconds(null, 4, () => {
                let [statusSuccess, statusStdout, statusStderr] = this._executeCommand('warp-cli status');

                if (statusSuccess) {
                    let statusOutput = statusStdout.toString().trim();

                    if (statusOutput.includes('Connected')) {
                        isConnected = true;
                        Main.notify(_('Connection to WARP successful'));
                    } else {
                        isConnected = 'Error';

                        let reason = statusOutput.includes('Reason') ? statusOutput.split('Reason:')[1].trim() : '';
                        Main.notify(`Error connecting to WARP: ${reason}`);
                    }
                } else {
                    isConnected = 'Error';
                    Main.notify(`Error checking WARP connection status: ${statusStderr}`);
                }

                this._updateSwitchState();
                
                return false;
            });
        } else {
            isConnected = 'Error';
            Main.notify(`Error connecting to WARP: ${connectStderr}`);
            this._updateSwitchState();
        }
    }

    _disconnectFromWarp() {
        try {
            let [success, stdout, stderr] = this._executeCommand('warp-cli disconnect');
            if (success && stdout.toString().trim() === 'Success') {
                isConnected = false;
                Main.notify(_('Disconnected from WARP'));
            } else {
                isConnected = 'Error';
                Main.notify(`Error disconnecting from WARP: ${stderr.toString().trim()}`);
            }
        } catch (e) {
            Main.notify(`Error disconnecting from WARP: ${e.message}`);
        }

        this._updateSwitchState();
    }

    _checkConnectionStatus() {
        try {
            let [success, stdout] = this._executeCommand('warp-cli status');
            if (success && stdout.toString().includes('Connected')) {
                isConnected = true;
            } else {
                isConnected = false;
            }
        } catch (e) {
            isConnected = 'Error';
            Main.notify(`Error checking WARP connection status: ${e.message}`);
        }

        this._updateSwitchState();
    }

    _updateSwitchState() {
            this._buttonSwitchItem.setToggleState(isConnected);
            switch (isConnected) {
                case 'Error':
                    this._icon.icon_name = 'weather-severe-alert-symbolic';
                    this._icon.style_class = 'warp-error';
                    this._isConnectedLabel.label.text = 'Error';
                    this._isConnectedLabel.style_class = 'warp-label-status-error';
                    break;
                case true:
                    this._icon.icon_name = 'weather-overcast-symbolic';
                    this._icon.style_class = 'warp-connected';
                    this._isConnectedLabel.label.text = 'Connected';
                    this._isConnectedLabel.style_class = 'warp-label-status';
                    break;
                default:
                    this._icon.icon_name = 'weather-overcast-symbolic';
                    this._icon.style_class = 'warp-disconnected';
                    this._isConnectedLabel.label.text = 'Disconnected';
                    this._isConnectedLabel.style_class = 'warp-label-status';
                    break;
            }
        }
});

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
