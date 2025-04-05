import Logger from '../logger.js';
import { DistroType } from '../models/enums.js';
import { commandExists } from './commandExecutor.js';

export async function detectDistro() {
    Logger.debug('Detecting Linux distribution type');

    try {
        if (await commandExists('apt') || await commandExists('apt-get')) {
            Logger.debug('Detected Debian-based distribution');
            return DistroType.DEB;
        }

        if (await commandExists('rpm') &&
            (await commandExists('dnf') || await commandExists('yum'))) {
            Logger.debug('Detected RPM-based distribution');
            return DistroType.RPM;
        }

        if (await commandExists('pacman')) {
            Logger.debug('Detected Arch-based distribution');
            return DistroType.ARCH;
        }

        Logger.debug('Unknown distribution type');
        return DistroType.UNKNOWN;
    } catch (e) {
        Logger.error(`Error detecting distribution: ${e.message}`);
        return DistroType.UNKNOWN;
    }
} 