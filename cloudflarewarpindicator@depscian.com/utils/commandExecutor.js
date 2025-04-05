import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Logger from '../logger.js';

export async function executeCommand(argv) {
    Logger.debug(`Executing command: ${argv.join(' ')}`);

    const flags = Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE;
    const proc = new Gio.Subprocess({ argv, flags });

    proc.init(null);

    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                const status = proc.get_exit_status();

                if (status !== 0) {
                    Logger.error(`Command failed with status ${status}: ${stderr.trim()}`);
                    reject(new Error(stderr ? stderr.trim() : GLib.strerror(status)));
                    return;
                }

                Logger.debug(`Command succeeded: ${stdout.trim()}`);
                resolve([true, stdout.trim(), stderr.trim()]);
            } catch (e) {
                reject(e);
            }
        });
    });
}

export async function executeCommandWithSudo(argv, sudoPrompt = 'Cloudflare WARP installation requires administrator privileges') {
    if (!await commandExists('sudo')) {
        throw new Error('sudo command not found');
    }

    try {
        if (await commandExists('pkexec')) {
            Logger.info('Using pkexec for privilege escalation');
            return await executeCommand(['pkexec', ...argv]);
        }

        Logger.info('Using direct sudo command');
        return await executeCommand(['sudo', ...argv]);
    } catch (e) {
        Logger.error(`Failed to execute with sudo: ${e.message}`);
        throw new Error(`Failed to execute with sudo: ${e.message}. Please run the installation manually.`);
    }
}

export async function commandExists(command) {
    try {
        const cmd = ['which', command];
        const [success, stdout, stderr] = await executeCommand(cmd);
        return success && stdout.trim() !== '';
    } catch (e) {
        Logger.error(`Error checking if command exists: ${e.message}`);
        return false;
    }
} 