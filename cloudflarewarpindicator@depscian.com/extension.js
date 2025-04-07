import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import Logger from './logger.js';
import { Indicator } from './indicator.js';

export default class WARPExtension extends Extension {
    enable() {
        Logger.info('Enabling Cloudflare WARP Indicator extension');
        
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        this._checkStatusTimeoutId = this._indicator.startPeriodicChecks(5);
        
        Logger.info('Extension enabled successfully');
    }

    disable() {
        Logger.info('Disabling Cloudflare WARP Indicator extension');
        
        if (this._checkStatusTimeoutId) {
            GLib.source_remove(this._checkStatusTimeoutId);
            this._checkStatusTimeoutId = null;
        }
        
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        
        Logger.info('Extension disabled successfully');
        Logger.shutdown();
    }
}
