import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Logger from '../logger.js';
import { ConnectionState } from '../models/enums.js';
import { executeCommand } from '../utils/commandExecutor.js';

export async function connect(setState) {
    Logger.info('Connecting to WARP');

    try {
        const [regStatus, regOutput] = await executeCommand(['warp-cli', '--accept-tos', 'status']);
        if (regStatus && regOutput.includes('Registration Missing')) {
            setState(ConnectionState.REGISTERING);

            const registered = await register(setState);
            if (!registered) {
                Logger.error('Registration failed, cannot connect');
                setState(ConnectionState.ERROR);
                return;
            }

            setState(ConnectionState.CONNECTING);
        }

        const [success, stdout, stderr] = await executeCommand(['warp-cli', '--accept-tos', 'connect']);

        if (success) {
            Logger.info('Connected to WARP');

            const [statusSuccess, statusOut] = await executeCommand(['warp-cli', '--accept-tos', 'status']);
            if (statusSuccess && statusOut.includes('Status update: Connected')) {
                setState(ConnectionState.CONNECTED);
            } else {
                setState(ConnectionState.CONNECTING);
            }
        } else {
            Logger.error(`Connection failed: ${stderr}`);
            setState(ConnectionState.ERROR);
        }
    } catch (e) {
        Logger.error(`Connection error: ${e.message}`);
        setState(ConnectionState.ERROR);
    }
}

export async function disconnect(setState) {
    Logger.info('Attempting to disconnect from WARP');

    try {
        const [success, stdout, stderr] = await executeCommand(['warp-cli', '--accept-tos', 'disconnect']);

        if (success && stdout === 'Success') {
            Logger.info('Successfully disconnected from WARP');
            setState(ConnectionState.DISCONNECTED);
        } else {
            Logger.error(`Disconnect failed: ${stderr}`);
            setState(ConnectionState.ERROR);
            Main.notify('Error disconnecting from WARP!');
        }
    } catch (e) {
        Logger.error(`Disconnect exception: ${e.message}`);
        setState(ConnectionState.ERROR);
        Main.notify('Error disconnecting from WARP!');
    }
}

export async function checkStatus(setState, currentState, lastStatusCheck, statusCacheTime) {
    Logger.debug('Checking WARP connection status');

    if (currentState === ConnectionState.INSTALLING) {
        Logger.debug('Skipping status check during installation');
        return lastStatusCheck;
    }

    if (currentState === ConnectionState.REGISTERING) {
        Logger.debug('Skipping status check during registration');
        return lastStatusCheck;
    }

    const now = Date.now();
    if ((now - lastStatusCheck) < statusCacheTime) {
        Logger.debug('Using cached status, still fresh');
        return lastStatusCheck;
    }

    try {
        const [success, stdout, stderr] = await executeCommand(['warp-cli', '--accept-tos', 'status']);

        if (success) {
            if (stdout.includes('Status update: Connected')) {
                Logger.debug('Status: Connected');
                setState(ConnectionState.CONNECTED);
            } else if (stdout.includes('Status update: Disconnected')) {
                Logger.debug('Status: Disconnected');
                setState(ConnectionState.DISCONNECTED);
            } else if (stdout.includes('Status update: Connecting')) {
                Logger.debug('Status: Connecting');
                setState(ConnectionState.CONNECTING);
            } else if (stdout.includes('Registration Missing')) {
                Logger.debug('Status: Registration missing');
                setState(ConnectionState.DISCONNECTED);
            }
        } else {
            Logger.error(`Status check failed: ${stderr}`);
            setState(ConnectionState.ERROR);
        }
    } catch (e) {
        Logger.error(`Status check exception: ${e.message}`);
        if (e.message.includes('No such file or directory') ||
            e.message.includes('not found')) {
            Logger.error('WARP is not installed. Install from https://pkg.cloudflareclient.com/');
            setState(ConnectionState.NOT_INSTALLED);
        } else {
            setState(ConnectionState.ERROR);
        }
    }

    return now;
}

export async function register(setState) {
    Logger.info('Registering to WARP');

    setState(ConnectionState.REGISTERING);

    try {
        const [success, stdout, stderr] = await executeCommand(['warp-cli', '--accept-tos', 'registration', 'new']);

        if (success) {
            Logger.info('Successfully registered to WARP');
            return true;
        } else {
            Logger.error(`Registration failed: ${stderr}`);
            setState(ConnectionState.ERROR);
            return false;
        }
    } catch (e) {
        Logger.error(`Registration error: ${e.message}`);
        setState(ConnectionState.ERROR);
        return false;
    }
} 