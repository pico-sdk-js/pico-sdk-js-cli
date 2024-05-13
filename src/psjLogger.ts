import chalk from 'chalk';

export enum LogLevel {
    Error = 0,
    Warning = 1,
    Debug = 2,
    Trace = 3,
    User = 4
}

export interface LogMessage {
    level: LogLevel;
    msg: string;
}

class PSJLogger {
    log(msg: LogMessage) {
        process.stdout.clearLine(0);
        console.log(this.getString(msg));
    }

    getString(msg: LogMessage) {
        switch (msg.level) {
            case LogLevel.Error:
                return `${chalk.red('ERR')}: ${msg.msg}`;
            case LogLevel.Warning:
                return `${chalk.yellow('WRN')}: ${msg.msg}`;
            case LogLevel.Debug:
                return `${chalk.green('DBG')}: ${msg.msg}`;
            case LogLevel.Trace:
                return `${chalk.blue('TRC')}: ${msg.msg}`;
            default:
                return msg.msg;
        }
    }
}

export const logger = new PSJLogger();
