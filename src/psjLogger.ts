import { LogMessage, LogLevel } from "./remote_process";
import chalk from 'chalk';

class PSJLogger {

    log(msg: LogMessage) {
        switch (msg.level) {
            case LogLevel.Error:
                console.log(`${chalk.red('ERR')}: ${msg.msg}`);
                break;
            case LogLevel.Warning:
                console.log(`${chalk.yellow('WRN')}: ${msg.msg}`);
                break;
            case LogLevel.Debug:
                console.log(`${chalk.green('DBG')}: ${msg.msg}`);
                break;
            case LogLevel.Trace:
                console.log(`${chalk.blue('TRC')}: ${msg.msg}`);
                break;
            default:
                console.log(msg.msg);
                break;
        }

    }
}

export const logger = new PSJLogger();