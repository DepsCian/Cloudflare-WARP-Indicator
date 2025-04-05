import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const LOG_FILE_PATH = '/tmp/warp-extension-debug.log';
const LOG_PREFIX = 'WARP';
const BUFFER_FLUSH_TIMEOUT = 5; 
const MAX_BUFFER_SIZE = 20;

export default class Logger {
    static _debugEnabled = null;
    static _logBuffer = [];
    static _flushTimeoutId = null;

    static _isDebugEnabled() {
        if (Logger._debugEnabled === null) {
            const debugVar = GLib.getenv('WARP_DEBUG');
            Logger._debugEnabled = debugVar === '1' || debugVar === 'true';
        }
        return Logger._debugEnabled;
    }

    static debug(message) {
        if (Logger._isDebugEnabled()) {
            Logger._log('DEBUG', message);
        }
    }

    static info(message) {
        Logger._log('INFO', message);
    }

    static warning(message) {
        Logger._log('WARNING', message);
    }

    static error(message) {
        Logger._log('ERROR', message, true);
    }

    static _log(level, message, forceFlush = false) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `${timestamp} [${LOG_PREFIX}] [${level}]: ${message}`;
        
        log(`${LOG_PREFIX}-${level}: ${message}`);
        
        if (level === 'DEBUG' && !Logger._isDebugEnabled()) {
            return;
        }
        
        Logger._logBuffer.push(formattedMessage);
        
        if (Logger._flushTimeoutId === null) {
            Logger._flushTimeoutId = GLib.timeout_add_seconds(
                GLib.PRIORITY_LOW,
                BUFFER_FLUSH_TIMEOUT,
                () => {
                    Logger._flushBuffer();
                    Logger._flushTimeoutId = null;
                    return GLib.SOURCE_REMOVE;
                }
            );
        }
        
        if (forceFlush || Logger._logBuffer.length >= MAX_BUFFER_SIZE) {
            if (Logger._flushTimeoutId) {
                GLib.source_remove(Logger._flushTimeoutId);
                Logger._flushTimeoutId = null;
            }
            Logger._flushBuffer();
        }
    }
    
    static _flushBuffer() {
        if (Logger._logBuffer.length === 0) {
            return;
        }
        
        try {
            const file = Gio.File.new_for_path(LOG_FILE_PATH);
            let outputStream;
            
            if (file.query_exists(null)) {
                outputStream = file.append_to(Gio.FileCreateFlags.NONE, null);
            } else {
                outputStream = file.create(Gio.FileCreateFlags.NONE, null);
            }
            
            outputStream.write_all(Logger._logBuffer.join('\n') + '\n', null);
            outputStream.close(null);
            
            Logger._logBuffer = [];
        } catch (e) {
            log(`${LOG_PREFIX}-ERROR: Failed to write to log file: ${e.message}`);
            Logger._logBuffer = [];
        }
    }
    
    static shutdown() {
        if (Logger._flushTimeoutId) {
            GLib.source_remove(Logger._flushTimeoutId);
            Logger._flushTimeoutId = null;
        }
        Logger._flushBuffer();
    }
} 