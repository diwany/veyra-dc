/**
 * Veyra Logger Utility
 */

const Logger = {
    _log(level, module, ...message) {
        const styles = {
            log: "color: #C4A265; font-weight: bold;",
            warn: "color: #FAA61A; font-weight: bold;",
            error: "color: #F04747; font-weight: bold;",
            debug: "color: #5865F2; font-weight: bold;"
        };
        console[level](
            `%c[Veyra]%c [${module}]`,
            styles[level] || styles.log,
            "color: #D4B87A;",
            ...message
        );
    },

    log(module, ...message) {
        this._log("log", module, ...message);
    },

    warn(module, ...message) {
        this._log("warn", module, ...message);
    },

    error(module, ...message) {
        this._log("error", module, ...message);
    },

    debug(module, ...message) {
        this._log("debug", module, ...message);
    },

    stacktrace(module, message, error) {
        console.error(
            `%c[Veyra]%c [${module}] ${message}\n`,
            "color: #F04747; font-weight: bold;",
            "color: #D4B87A;",
            error
        );
    }
};

export default Logger;
