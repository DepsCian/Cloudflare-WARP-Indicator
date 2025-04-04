const GObject = imports.gi.GObject;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;

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

        this._buttonSwitchItem = new PopupMenu.PopupSwitchMenuItem(_(''), false, { style_class: 'warp-switch' });
        this._buttonSwitchItem.connect('toggled', () => {
            this._toggleWarpConnection();
        });
        this._label = new PopupMenu.PopupMenuItem('WARP', { style_class: 'warp-label' });
        this._isConnectedLabel = new PopupMenu.PopupMenuItem('Disconnected', { style_class: 'warp-label-status' });
        this._label.set_x_align(2);
        this.menu.addMenuItem(this._label);
        this._buttonSwitchItem.set_x_align(2);
        this.menu.addMenuItem(this._buttonSwitchItem);
        this._isConnectedLabel.set_x_align(2);
        this.menu.addMenuItem(this._isConnectedLabel);
        this._checkConnectionStatus();
        this._updateSwitchState();
    }

    async _toggleWarpConnection() {
        if (isConnected) {
            await this._disconnectFromWarp();
        } else {
            await this._connectToWarp();
        }
    }

    async _executeCommandAsync(argv, input = null, cancellable = null) {
        let flags = Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE;
        if (input !== null)
            flags |= Gio.SubprocessFlags.STDIN_PIPE;
        const proc = new Gio.Subprocess({ argv, flags });
        proc.init(cancellable);
        let cancelId = 0;
        if (cancellable instanceof Gio.Cancellable)
            cancelId = cancellable.connect(() => proc.force_exit());

        return new Promise((resolve, reject) => {
            proc.communicate_utf8_async(input, null, (_proc, res) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    const status = proc.get_exit_status();
                    if (status !== 0) {
                        throw new Gio.IOErrorEnum({
                            code: Gio.io_error_from_errno(status),
                            message: stderr ? stderr.trim() : GLib.strerror(status),
                        });
                    }

                    resolve([true, stdout.toString().trim(), stderr.toString().trim()]);
                } catch (e) {
                    reject(e);
                } finally {
                    if (cancelId > 0)
                        cancellable.disconnect(cancelId);
                }
            });
        });
    }

    async _connectToWarp() {
        let [connectSuccess, connectStderr] = await this._executeCommandAsync(['warp-cli', 'connect']);
        isConnected = 'Connecting...';

        if (connectSuccess) {
            let checkStatus = () => {
                this._executeCommandAsync(['warp-cli', 'status']).then(([statusSuccess, statusStdout, statusStderr]) => {
                    if (statusSuccess) {
                        let statusOutput = statusStdout;
                        if (statusOutput.includes('Connected')) {
                            isConnected = true;
                            Main.notify(_('Connection to WARP successful!'));
                        } else {
                            isConnected = 'Error';
                            let reason = statusOutput.includes('Reason') ? statusOutput.split('Reason:')[1] : '';
                            Main.notify(`Error connecting to WARP: ${reason}`);
                        }
                    } else {
                        isConnected = 'Error';
                        Main.notify(`Error checking WARP connection status!`);
                        log('ERROR | Cloudflare WARP Indicator: ' + statusStderr);
                    }
                    this._updateSwitchState();
                });
                return false;
            };
            this._connectTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 4000, checkStatus);
        } else {
            isConnected = 'Error';
            Main.notify(`Error connecting to WARP!`);
            log('ERROR | Cloudflare WARP Indicator: ' + connectStderr);
            this._updateSwitchState();
        }
    }

    async _disconnectFromWarp() {
        try {
            let [success, stdout, stderr] = await this._executeCommandAsync(['warp-cli', 'disconnect']);
            if (success && stdout === 'Success') {
                isConnected = false;
                Main.notify(_('Disconnected from WARP!'));
            } else {
                isConnected = 'Error';
                Main.notify(`Error disconnecting from WARP!`);
                log('ERROR | Cloudflare WARP Indicator: ' + stderr);
            }
        } catch (e) {
            Main.notify(`Error disconnecting from WARP!`);
            log('ERROR | Cloudflare WARP Indicator: ' + e.message);
        }
        this._updateSwitchState();
    }

    async _checkConnectionStatus(isTimer = false) {
        try {
            let [success, stdout, stderr] = await this._executeCommandAsync(['warp-cli', 'status']);
        
            if (success && stdout.includes('Connected')) {
                if (!isConnected) {
                    isConnected = true;
        
                    if (isTimer && !this._wasConnected) {
                        this._wasConnected = true;
                        Main.notify(_('Connection to WARP successful!'));
                    }
                }
            } else if (success && stdout.includes('Disconnected')) {
                if (isConnected) {
                    isConnected = false;
        
                    if (isTimer && this._wasConnected) {
                        this._wasConnected = false;
                        Main.notify(`Connection to WARP lost!`);
                    }
                }
            } else if (success && stdout.includes('Registration Missing') && isConnected === 'Connecting...') {
                Main.notify('Registering to WARP...');
                const [regSuccess, regStdout] = await this._executeCommandAsync(['warp-cli', 'registration', 'new']);
                if (regSuccess && regStdout.includes('Success')) {
                    Main.notify('Successfully registered to WARP!');
                } else {
                    this.isConnected = 'Error';
                    Main.notify(`Error registering to WARP!`);
                    log(`ERROR | Cloudflare WARP Indicator: ${regStdout}`);
                }
            }
        } catch (e) {
            if (e.message.includes('No such file or directory') || e.message.includes('not found') && isConnected !== 'Error') {
                Main.notify('Cloudflare WARP is not installed!');
                log(`ERROR | Cloudflare WARP Indicator: Cloudflare WARP is not installed! Install it from https://pkg.cloudflareclient.com/`);
            } else if (isConnected !== 'Error') {
                log(`ERROR | Cloudflare WARP Indicator: ${e.message}`);
            }
            isConnected = 'Error';
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

    destroy() {
        if (this._connectTimer) {
            GLib.source_remove(this._connectTimer);
        }
        super.destroy();
    }
});

function init() {
    return new WARPExtension();
}

class WARPExtension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._checkStatusTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
            try {
                this._indicator._checkConnectionStatus(true);
            } catch (e) {
                log(`ERROR | Cloudflare WARP Indicator: ${e.message}`);
            }
            return true;
        });
    }

    disable() {
        if (this._checkStatusTimeoutId) {
            GLib.source_remove(this._checkStatusTimeoutId);
        }
        this._indicator.destroy();
        this._indicator = null;
    }
}