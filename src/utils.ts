const os = require('os');

const LOCAL_OS_TYPE = os.type();

export class OSUtils {
    static type = {
        macOS : 'Darwin',
        linux: 'Linux',
        windows: 'Windows_NT',
    };

    static isMacOS() : boolean {
        return LOCAL_OS_TYPE === OSUtils.type.macOS;
    }

    static isLinux() : boolean {
        return LOCAL_OS_TYPE === OSUtils.type.linux;
    }

    static isWindows() : boolean {
        return LOCAL_OS_TYPE === OSUtils.type.windows;
    }
}