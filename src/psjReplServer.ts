import repl, { REPLServer } from 'repl';
import { Context } from 'vm';
import { CommandError, PicoSdkJsEngineConnection } from './PicoSdkJsEngineConnection';
import { LogLevel, LogMessage, logger } from './psjLogger';
import { lsCommand } from './replCommands/lsCommand';
import { statsCommand } from './replCommands/statsCommand';
import { writeCommand } from './replCommands/writeCommand';
import { readCommand } from './replCommands/readCommand';
import { deleteCommand } from './replCommands/deleteCommand';
import { formatCommand } from './replCommands/formatCommand';
import { restartCommand } from './replCommands/restartCommand';
import { killCommand } from './replCommands/killCommand';
import { runCommand } from './replCommands/runCommand';

export class PsjReplServer {
    private connection: PicoSdkJsEngineConnection | null;
    private maxLogLevel: LogLevel = LogLevel.Error;
    private server: REPLServer | null = null;
    private commandInProgress = false;

    constructor(connection: PicoSdkJsEngineConnection) {
        this.connection = connection;
        this.connection.onLog = (m) => {
            this.logFn(m);
        };
        this.connection.onClose = () => {
            logger.logMsg(LogLevel.Error, 'Connection to Pico-SDK-JS engine lost.');
            this.connection = null;
            this.close();
        };
    }

    public getConnection(): PicoSdkJsEngineConnection | null {
        return this.connection;
    }

    public async close() {
        if (this.server) {
            this.server.close();

            const closePromise = this.connection?.close();
            this.server = null;

            await closePromise;
        }
    }

    public start() {
        this.server = repl.start({
            eval: (evalCmd: string, context: Context, file: string, cb: (err: Error | null, result: unknown) => void) => {
                this.remoteEval(evalCmd, context, file, cb);
            },
            preview: false,
            ignoreUndefined: true
        });

        this.server.on('exit', async () => {
            await this.close();
        });

        this.server.on('reset', async () => this.wrapCommand(() => restartCommand(this, '')));

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
         * Need to delete commands from ReadOnlyDict<>, so using any to enable
         **/
        const commands = this.server.commands as any;
        delete commands.break;
        delete commands.editor;
        delete commands.load;
        delete commands.save;
        delete commands.clear;

        this.server.defineCommand('stats', {
            help: 'Get information on the connected device',
            action: (text: string) => this.wrapCommand(() => statsCommand(this, text))
        });

        this.server.defineCommand('ls', {
            help: 'List files stored on the connected device',
            action: (text: string) => this.wrapCommand(() => lsCommand(this, text))
        });

        this.server.defineCommand('write', {
            help: 'Write a local file to the connected device',
            action: (text: string) => this.wrapCommand(() => writeCommand(this, text))
        });

        this.server.defineCommand('read', {
            help: 'Read a file on the connected device',
            action: (text: string) => this.wrapCommand(() => readCommand(this, text))
        });

        this.server.defineCommand('delete', {
            help: 'Delete a file on the connected device',
            action: (text: string) => this.wrapCommand(() => deleteCommand(this, text))
        });

        this.server.defineCommand('format', {
            help: 'Delete all files and reformat the connected device',
            action: (text: string) => this.wrapCommand(() => formatCommand(this, text))
        });

        this.server.defineCommand('restart', {
            help: 'Clear the device context and restart the entry script',
            action: (text: string) => this.wrapCommand(() => restartCommand(this, text))
        });

        this.server.defineCommand('kill', {
            help: 'Stops the script running on the device',
            action: (text: string) => this.wrapCommand(() => killCommand(this, text))
        });

        this.server.defineCommand('run', {
            help: 'Executes a file stored on the device',
            action: (text: string) => this.wrapCommand(() => runCommand(this, text))
        });
    }

    public setLogLevel(level: LogLevel) {
        this.maxLogLevel = level;
    }

    private logFn(msg: LogMessage) {
        if (msg.level > this.maxLogLevel && msg.level !== LogLevel.User) return;

        logger.log(msg);

        if (!this.commandInProgress) {
            this.server?.displayPrompt(true);
        }
    }

    private async remoteEval(evalCmd: string, _context: Context, _file: string, cb: (err: Error | null, result: unknown) => void): Promise<void> {
        try {
            this.commandInProgress = true;
            const result = await this.exec(evalCmd);
            cb(null, result);
        } catch (error) {
            if (CommandError.isCommandError(error)) {
                const cmdError = error as CommandError;
                logger.log({ level: LogLevel.Error, msg: cmdError.message });
                cb(null, undefined);
                return;
            }

            let e: Error;
            if (error instanceof Error) e = error;
            else e = new Error(String(error));

            cb(e, null);
        } finally {
            this.commandInProgress = false;
        }
    }

    private async wrapCommand(action: () => Promise<void>): Promise<void> {
        try {
            this.commandInProgress = true;
            await action();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            const message: string = error?.message ?? String(error);

            this.logFn({
                level: LogLevel.Error,
                msg: message
            });
        } finally {
            this.commandInProgress = false;
            this.server?.displayPrompt();
        }
    }

    public async exec(cmd: string): Promise<unknown> {
        if (!this.connection) {
            this.logFn({ level: LogLevel.Error, msg: 'Not connected' });
            return undefined;
        }

        const response = await this.connection.exec(cmd);
        if (response.value instanceof Error) {
            throw response.value;
        }

        return response.value;
    }
}
