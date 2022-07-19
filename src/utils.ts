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

// comments are taken from https://docs.scipy.org/doc/numpy-1.14.1/neps/npy-format.html#format-specification-version-1-0
// For a simple way to combine multiple arrays into a single file, one can use ZipFile to contain multiple “.npy” files. 
// We recommend using the file extension “.npz” for these archives.

function unZipFile() {
    var names : Array<string> = [];
    var buffers : Array<ArrayBuffer> = [];

    // 
}