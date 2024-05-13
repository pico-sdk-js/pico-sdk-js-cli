import repl, { REPLServer } from 'repl';
import { Context } from 'vm';
import { CommandError, PicoSdkJsEngineConnection } from './PicoSdkJsEngineConnection';
import { LogLevel, LogMessage, logger } from './psjLogger';
import { connectToPico } from './commands/connectCommand';
import { disconnectFromPico } from './commands/disconnectCommand';
import { lsCommand } from './commands/lsCommand';
import { statsCommand } from './commands/statsCommand';
import { writeCommand } from './commands/writeCommand';
import { readCommand } from './commands/readCommand';
import { deleteCommand } from './commands/deleteCommand';
import { formatCommand } from './commands/formatCommand';

export class PsjReplServer {
    private connection: PicoSdkJsEngineConnection | null = null;
    private maxLogLevel: LogLevel = LogLevel.Error;
    private server: REPLServer | null = null;
    private commandInProgress: boolean = false;

    constructor() {
    }

    public getConnection(): PicoSdkJsEngineConnection | null {
        return this.connection;
    }

    public setConnection(connection: PicoSdkJsEngineConnection | null): void {
        if (this.connection) {
            this.connection.log = () => {};
            this.connection = null;
        }

        if (connection) {
            this.connection = connection;
            this.connection.log = (m) => { this.logFn(m) };
        }
    }

    public start() {
        this.server = repl.start({
            eval: (evalCmd: string, context: Context, file: string, cb: (err: Error | null, result: any) => void) => {
                this.remoteEval(evalCmd, context, file, cb);
            },
            preview: false,
            ignoreUndefined: true
        });
    
        this.server.on("exit", async () => {
            const closePromise = this.connection?.close();
            this.server = null;
            this.connection = null;
            
            await closePromise;
        });

        this.server.on("reset", async () => this.wrapCommand(() => this.resetContextOnPico()));
    
        this.server.defineCommand("connect", {
            help: "Connect to a Pico running Pico-Sdk-JS",
            action: (text: string) => this.wrapCommand(() => connectToPico(this, text))
        });
    
        this.server.defineCommand("disconnect", {
            help: "Disconnect a Pico running Pico-Sdk-JS",
            action: (_text: string) => this.wrapCommand(() => disconnectFromPico(this))
        });

        this.server.defineCommand("stats", {
            help: "Get information on the connected device",
            action: (text: string) => this.wrapCommand(() => statsCommand(this, text))
        });

        this.server.defineCommand("ls", {
            help: "List files stored on the connected device",
            action: (text: string) => this.wrapCommand(() => lsCommand(this, text))
        });

        this.server.defineCommand("write", {
            help: "Write a local file to the connected device",
            action: (text: string) => this.wrapCommand(() => writeCommand(this, text))
        });        

        this.server.defineCommand("read", {
            help: "Read a file on the connected device",
            action: (text: string) => this.wrapCommand(() => readCommand(this, text))
        });        

        this.server.defineCommand("delete", {
            help: "Delete a file on the connected device",
            action: (text: string) => this.wrapCommand(() => deleteCommand(this, text))
        });        

        this.server.defineCommand("format", {
            help: "Delete all files and reformat the connected device",
            action: (text: string) => this.wrapCommand(() => formatCommand(this, text))
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

    private async remoteEval(
        evalCmd: string,
        _context: Context,
        _file: string,
        cb: (err: Error | null, result: any) => void
    ): Promise<void> {
        try {
            this.commandInProgress = true;
            const result = await this.exec(evalCmd);
            cb(null, result);
        } catch (error) {
            if (error instanceof CommandError) {
                logger.log({ level: LogLevel.Error, msg: error.message });
                cb(null, undefined);
                return;
            }
            
            let e: Error;
            if (error instanceof Error) e = error;
            else e = new Error(String(error))

            cb(e, null);
        } finally {
            this.commandInProgress = false;
        }
    }

    private async wrapCommand(action: () => Promise<void>): Promise<void> {
        try {
            this.commandInProgress = true;
            await action();
        } catch (error) {
            let message: string;
            if (error instanceof Error) message = error.message;
            else message = String(error);

            this.logFn({
                level: LogLevel.Error,
                msg: message
            });
        } finally {
            this.commandInProgress = false;
            this.server?.displayPrompt();
        }
    }

    public async resetContextOnPico(): Promise<any> {
        if (!this.connection) {
            this.logFn({ level: LogLevel.Error, msg: "Not connected" });
            return undefined;
        }

        var response = await this.connection.reset();
        if (response.value instanceof Error) {
            throw response.value;
        }

        return response.value;
    }

    public async exec(cmd: string): Promise<any> {
        if (!this.connection) {
            this.logFn({ level: LogLevel.Error, msg: "Not connected" });
            return undefined;
        }

        var response = await this.connection.exec(cmd);
        if (response.value instanceof Error) {
            throw response.value;
        }

        return response.value;
    }
}
