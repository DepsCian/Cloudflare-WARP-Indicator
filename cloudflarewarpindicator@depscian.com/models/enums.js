export const ConnectionState = {
    DISCONNECTED: 0,
    CONNECTED: 1,
    CONNECTING: 2,
    INSTALLING: 3,
    ERROR: 4,
    NOT_INSTALLED: 5,
    REGISTERING: 6
};

export const InstallationStep = {
    NONE: 'none',
    CHECKING_DEPS: 'checking_deps',
    DETECTING_DISTRO: 'detecting_distro',
    REQUESTING_SUDO: 'requesting_sudo',
    ADDING_REPO: 'adding_repo',
    INSTALLING_PACKAGE: 'installing_package',
    STARTING_SERVICE: 'starting_service',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

export const DistroType = {
    DEB: 'deb',
    RPM: 'rpm',
    ARCH: 'arch',
    UNKNOWN: 'unknown'
}; 