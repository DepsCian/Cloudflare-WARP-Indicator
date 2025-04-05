import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Logger from './logger.js';
import { ConnectionState, InstallationStep, DistroType } from './models/enums.js';
import { detectDistro } from './utils/distroDetector.js';
import { connect, disconnect, checkStatus, register } from './services/connectionHandler.js';
import { installWarp, recommendManualInstallation, verifyInstallation } from './services/installationHandler.js';

export default class WarpController {
    constructor() {
        this._state = ConnectionState.DISCONNECTED;
        this._stateChangedCallbacks = [];
        this._lastStatusCheck = 0;
        this._statusCacheTime = 10000;
        this._installProgress = 0;
        this._installStep = InstallationStep.NONE;
        this._installStepCallbacks = [];
        this._distroType = DistroType.UNKNOWN;
        this._sudoToken = null;
    }

    get state() {
        return this._state;
    }

    get installProgress() {
        return this._installProgress;
    }

    get installStep() {
        return this._installStep;
    }

    addStateChangedCallback(callback) {
        this._stateChangedCallbacks.push(callback);
    }

    removeStateChangedCallback(callback) {
        const index = this._stateChangedCallbacks.indexOf(callback);
        if (index !== -1) {
            this._stateChangedCallbacks.splice(index, 1);
        }
    }

    addInstallStepCallback(callback) {
        this._installStepCallbacks.push(callback);
    }

    removeInstallStepCallback(callback) {
        const index = this._installStepCallbacks.indexOf(callback);
        if (index !== -1) {
            this._installStepCallbacks.splice(index, 1);
        }
    }

    _setState(state) {
        if (this._state !== state) {
            this._state = state;
            Logger.debug(`Connection state changed to: ${state}`);
            
            for (const callback of this._stateChangedCallbacks) {
                try {
                    callback(state);
                } catch (e) {
                    Logger.error(`Error in state change callback: ${e.message}`);
                }
            }
        }
    }

    _setInstallStep(step, progress) {
        this._installStep = step;
        this._installProgress = progress;
        
        Logger.debug(`Installation progress: ${step} (${progress}%)`);
        
        for (const callback of this._installStepCallbacks) {
            try {
                callback(step, progress);
            } catch (e) {
                Logger.error(`Error in install step callback: ${e.message}`);
            }
        }
    }

    async connect() {
        if (this._state === ConnectionState.CONNECTED) {
            Logger.info('Already connected');
            return;
        }
        
        this._setState(ConnectionState.CONNECTING);
        await connect(this._setState.bind(this));
    }

    async disconnect() {
        await disconnect(this._setState.bind(this));
    }

    async checkStatus() {
        if (this._state === ConnectionState.INSTALLING) {
            return;
        }
        
        if (this._state === ConnectionState.REGISTERING) {
            return;
        }
        
        this._lastStatusCheck = await checkStatus(
            this._setState.bind(this),
            this._state,
            this._lastStatusCheck,
            this._statusCacheTime
        );
    }

    async installWarp() {
        this._distroType = await detectDistro();
        
        await installWarp(
            this._setState.bind(this),
            this._setInstallStep.bind(this),
            this._ensureProperInstallationState.bind(this)
        );
    }

    async _ensureProperInstallationState() {
        await verifyInstallation(
            this._setState.bind(this),
            this._state,
            this._installStep,
            this._distroType
        );
    }

    _cleanupSudoToken() {
        if (this._sudoToken) {
            Logger.info('Clearing sudo session token');
            this._sudoToken = null;
        }
    }
} 