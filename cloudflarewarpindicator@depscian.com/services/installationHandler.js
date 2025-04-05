import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Logger from '../logger.js';
import { ConnectionState, InstallationStep, DistroType } from '../models/enums.js';
import { executeCommand, executeCommandWithSudo, commandExists } from '../utils/commandExecutor.js';
import { detectDistro } from '../utils/distroDetector.js';

export async function installWarp(setState, setInstallStep, ensureProperInstallationState) {
    setState(ConnectionState.INSTALLING);
    setInstallStep(InstallationStep.CHECKING_DEPS, 0);
    Logger.info('Starting Cloudflare WARP installation');

    try {
        const requiredCommands = ['curl', 'sudo'];
        for (const cmd of requiredCommands) {
            if (!await commandExists(cmd)) {
                const error = `Required command '${cmd}' not found`;
                Logger.error(error);
                setInstallStep(InstallationStep.FAILED, 0);
                Main.notify(`Installation failed: ${error}`);
                setState(ConnectionState.ERROR);
                return;
            }
        }

        setInstallStep(InstallationStep.DETECTING_DISTRO, 20);
        const distroType = await detectDistro();

        if (distroType === DistroType.UNKNOWN) {
            const error = 'Unsupported Linux distribution';
            Logger.error(error);
            setInstallStep(InstallationStep.FAILED, 20);
            Main.notify(`Installation failed: ${error}`);
            setState(ConnectionState.ERROR);
            return;
        }

        setInstallStep(InstallationStep.REQUESTING_SUDO, 30);
        setInstallStep(InstallationStep.ADDING_REPO, 40);

        let installSuccess = false;
        switch (distroType) {
            case DistroType.DEB:
                installSuccess = await installWarpDeb(setInstallStep);
                break;
            case DistroType.RPM:
                installSuccess = await installWarpRpm(setInstallStep);
                break;
            case DistroType.ARCH:
                installSuccess = await installWarpArch();
                break;
        }

        if (!installSuccess) {
            setInstallStep(InstallationStep.FAILED, 70);
            Main.notify('Failed to install Cloudflare WARP. Try manual installation.');
            setState(ConnectionState.ERROR);
            recommendManualInstallation();
            return;
        }

        setInstallStep(InstallationStep.STARTING_SERVICE, 85);
        await startWarpService();

        setInstallStep(InstallationStep.COMPLETED, 100);
        Logger.info('Cloudflare WARP installation completed successfully');

        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000, () => {
            ensureProperInstallationState();
            return GLib.SOURCE_REMOVE;
        });
    } catch (e) {
        Logger.error(`Installation failed: ${e.message}`);
        setInstallStep(InstallationStep.FAILED, 0);
        Main.notify(`Failed to install Cloudflare WARP: ${e.message}`);
        setState(ConnectionState.ERROR);
        recommendManualInstallation();
    }
}

async function installWarpDeb(setInstallStep) {
    try {
        Logger.debug('Adding Cloudflare GPG key');
        await executeCommandWithSudo([
            'bash', '-c',
            'curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg'
        ]);

        setInstallStep(InstallationStep.ADDING_REPO, 40);

        Logger.debug('Adding Cloudflare repository');
        const supportedDebianReleases = ['buster', 'bullseye', 'bookworm', 'stretch', 'bionic', 'focal', 'jammy'];

        let codename = '';
        try {
            const [success, stdout] = await executeCommand(['lsb_release', '-cs']);
            if (success) {
                codename = stdout.trim();
            }
        } catch (e) {
            try {
                const [success, stdout] = await executeCommand(['bash', '-c', '. /etc/os-release && echo $VERSION_CODENAME']);
                if (success) {
                    codename = stdout.trim();
                }
            } catch (err) {
                Logger.error(`Could not determine distribution codename: ${err.message}`);
            }
        }

        if (!supportedDebianReleases.includes(codename)) {
            Logger.warning(`Your distribution '${codename}' is not officially supported by Cloudflare`);
            const fallbackCodename = 'bookworm';
            Logger.info(`Using '${fallbackCodename}' as a fallback repository`);
            codename = fallbackCodename;
        }

        await executeCommandWithSudo([
            'bash', '-c',
            `echo "deb [arch=amd64 signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ ${codename} main" > /etc/apt/sources.list.d/cloudflare-client.list`
        ]);

        setInstallStep(InstallationStep.INSTALLING_PACKAGE, 50);

        Logger.debug('Updating package lists');
        try {
            await executeCommandWithSudo(['apt-get', 'update']);
        } catch (e) {
            Logger.warning(`apt-get update failed: ${e.message}`);
        }

        setInstallStep(InstallationStep.INSTALLING_PACKAGE, 70);

        Logger.debug('Installing Cloudflare WARP package');
        await executeCommandWithSudo(['apt-get', 'install', '-y', 'cloudflare-warp']);

        return true;
    } catch (e) {
        Logger.error(`DEB installation failed: ${e.message}`);
        return false;
    }
}

async function installWarpRpm(setInstallStep) {
    try {
        Logger.debug('Adding Cloudflare RPM repository');

        let repoUrl = '';
        let distro = '';

        try {
            const [fedoraCheck] = await executeCommand(['bash', '-c', 'grep -i fedora /etc/os-release']);
            if (fedoraCheck) {
                distro = 'fedora';
                repoUrl = 'https://pkg.cloudflareclient.com/rpm/fedora/cloudflareclient.repo';
            } else {
                distro = 'rhel';
                repoUrl = 'https://pkg.cloudflareclient.com/rpm/rhel/cloudflareclient.repo';
            }
        } catch {
            distro = 'rhel';
            repoUrl = 'https://pkg.cloudflareclient.com/rpm/rhel/cloudflareclient.repo';
        }

        Logger.debug(`Detected RPM distro: ${distro}`);

        await executeCommandWithSudo([
            'bash', '-c',
            `curl -fsSL ${repoUrl} > /etc/yum.repos.d/cloudflare-client.repo`
        ]);

        setInstallStep(InstallationStep.INSTALLING_PACKAGE, 50);

        Logger.debug('Installing Cloudflare WARP package');
        if (await commandExists('dnf')) {
            await executeCommandWithSudo(['dnf', 'install', '-y', 'cloudflare-warp']);
        } else {
            await executeCommandWithSudo(['yum', 'install', '-y', 'cloudflare-warp']);
        }

        return true;
    } catch (e) {
        Logger.error(`RPM installation failed: ${e.message}`);
        return false;
    }
}

async function installWarpArch() {
    try {
        const hasYay = await commandExists('yay');

        if (hasYay) {
            Logger.debug('Installing Cloudflare WARP using yay');
            await executeCommand(['yay', '-S', '--noconfirm', 'cloudflare-warp-bin']);
        } else {
            Logger.debug('Installing Cloudflare WARP manually from AUR');

            if (!await commandExists('git') || !await commandExists('makepkg')) {
                throw new Error('Required packages git and base-devel are not installed');
            }

            const tempDir = GLib.dir_make_tmp('warp-install-XXXXXX');

            await executeCommand(['git', 'clone', 'https://aur.archlinux.org/cloudflare-warp-bin.git', tempDir]);

            await executeCommand(['bash', '-c', `cd ${tempDir} && makepkg -si --noconfirm`]);

            await executeCommand(['rm', '-rf', tempDir]);
        }

        return true;
    } catch (e) {
        Logger.error(`Arch installation failed: ${e.message}`);
        return false;
    }
}

async function startWarpService() {
    try {
        if (await commandExists('systemctl')) {
            await executeCommandWithSudo(['systemctl', 'enable', '--now', 'warp-svc']);
            return true;
        }

        if (await commandExists('service')) {
            await executeCommandWithSudo(['service', 'warp-svc', 'start']);
            return true;
        }

        await executeCommandWithSudo(['warp-svc']);
        return true;
    } catch (e) {
        Logger.error(`Failed to start WARP service: ${e.message}`);
        return false;
    }
}

export function recommendManualInstallation() {
    Logger.info('Recommending manual installation');

    Main.notify('Automatic installation failed. Please visit the Cloudflare WARP website for manual installation instructions.');

    try {
        executeCommand(['bash', '-c', 'xdg-open https://pkg.cloudflareclient.com/ || true']);
    } catch (e) {
        Logger.error(`Failed to open browser: ${e.message}`);
    }
}

export async function verifyInstallation(setState, currentState, installStep, distroType) {
    Logger.debug('Verifying WARP installation and setting proper state');

    if (currentState === ConnectionState.INSTALLING && installStep !== InstallationStep.COMPLETED) {
        Logger.debug('Skipping installation verification - installation still in progress');
        return;
    }

    try {
        try {
            if (await commandExists('warp-cli')) {
                Logger.debug('warp-cli found, checking status');

                try {
                    const [success, stdout, stderr] = await executeCommand(['warp-cli', '--accept-tos', 'status']);

                    if (success) {
                        if (stdout.includes('Status update: Connected')) {
                            Logger.debug('WARP is connected after installation');
                            setState(ConnectionState.CONNECTED);
                            return;
                        } else if (stdout.includes('Status update: Disconnected')) {
                            Logger.debug('WARP is installed but disconnected');
                            setState(ConnectionState.DISCONNECTED);
                            return;
                        } else if (stdout.includes('Registration Missing')) {
                            Logger.debug('WARP needs registration after installation');
                            setState(ConnectionState.DISCONNECTED);
                            return;
                        }
                    }
                } catch (e) {
                    Logger.warning(`Status check after installation failed: ${e.message}`);
                }
            }
        } catch (e) {
            Logger.warning(`warp-cli not found after installation: ${e.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            let isInstalled = false;

            if (distroType === DistroType.DEB) {
                const [success, stdout] = await executeCommand(['dpkg', '-l', 'cloudflare-warp']);
                isInstalled = success && stdout.includes('cloudflare-warp');
            } else if (distroType === DistroType.RPM) {
                const [success, stdout] = await executeCommand(['rpm', '-q', 'cloudflare-warp']);
                isInstalled = success && stdout.includes('cloudflare-warp');
            } else if (distroType === DistroType.ARCH) {
                const [success, stdout] = await executeCommand(['pacman', '-Qi', 'cloudflare-warp-bin']);
                isInstalled = success && stdout.includes('cloudflare-warp');
            }

            if (installStep === InstallationStep.COMPLETED) {
                if (isInstalled) {
                    Logger.debug('WARP package is installed after completion, updating UI state');
                    setState(ConnectionState.DISCONNECTED);
                } else {
                    Logger.error('WARP package does not appear to be installed after completion');
                    setState(ConnectionState.NOT_INSTALLED);
                }
            } else if (currentState !== ConnectionState.INSTALLING) {
                if (isInstalled) {
                    Logger.debug('WARP package is installed, but service may not be fully started');
                    setState(ConnectionState.DISCONNECTED);
                } else {
                    Logger.error('WARP package does not appear to be installed');
                    setState(ConnectionState.NOT_INSTALLED);
                }
            } else {
                Logger.debug('Ignoring package check results during ongoing installation');
            }
        } catch (e) {
            if (installStep === InstallationStep.COMPLETED) {
                Logger.error(`Failed to verify installation after completion: ${e.message}`);
                setState(ConnectionState.DISCONNECTED);
            } else if (currentState !== ConnectionState.INSTALLING) {
                Logger.error(`Failed to verify installation: ${e.message}`);
                setState(ConnectionState.DISCONNECTED);
            } else {
                Logger.debug('Ignoring verification error during ongoing installation');
            }
        }
    } catch (e) {
        if (installStep === InstallationStep.COMPLETED) {
            Logger.error(`Error in verifyInstallation after completion: ${e.message}`);
            setState(ConnectionState.DISCONNECTED);
        } else if (currentState !== ConnectionState.INSTALLING) {
            Logger.error(`Error in verifyInstallation: ${e.message}`);
            setState(ConnectionState.DISCONNECTED);
        } else {
            Logger.debug(`Ignoring verification error during installation: ${e.message}`);
        }
    }
} 