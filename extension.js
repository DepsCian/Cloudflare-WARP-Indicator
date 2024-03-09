/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

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
    
        this._buttonSwitchItem = new PopupMenu.PopupSwitchMenuItem(_('Toggle WARP Connection'), { status: false, style_class: 'toggle-switch' });
        this._buttonSwitchItem.connect('toggled', () => {
            this._toggleWarpConnection();
        });
        this.menu.addMenuItem(this._buttonSwitchItem);
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
                    break;
                case true:
                    this._icon.icon_name = 'weather-overcast-symbolic';
                    this._icon.style_class = 'warp-connected';
                    break;
                default:
                    this._icon.icon_name = 'weather-overcast-symbolic';
                    this._icon.style_class = 'warp-disconnected';
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
