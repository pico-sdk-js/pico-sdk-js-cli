import repl, { REPLCommandAction, REPLServer } from 'repl';
import { Context } from "vm";
import { PicoSdkJsEngineConnection, LogLevel, LogMessage, LocalProcessPicoSdkJsEngineConnection } from "./remote_process";
import { logger } from './psjLogger';
import Yargs from 'yargs/yargs';

export class PsjReplServer {
    private connection: PicoSdkJsEngineConnection | null = null;
    private maxLogLevel: LogLevel = LogLevel.Error;
    private server?: REPLServer;
    private commandInProgress: boolean = false;
    
    constructor() {
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
            await this.connection?.close();
        });
    
        this.server.defineCommand("connect", {
            help: "Connect to a Pico running Pico-Sdk-JS",
            action: (text: string) => this.wrapCommand(() => this.connectToPico(text))
        });
    
        this.server.defineCommand("disconnect", {
            help: "Disconnect a Pico running Pico-sdk-JS",
            action: (text: string) => this.wrapCommand(() => this.disconnectFromPico())
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
        context: Context,
        file: string,
        cb: (err: Error | null, result: any) => void
    ): Promise<void> {
        try {
            this.commandInProgress = true;
            const result = await this.exec(evalCmd);
            cb(null, result);
        } catch (error) {
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

    public async exec(cmd: string): Promise<any> {
        if (this.connection === null) {
            this.logFn({ level: LogLevel.Error, msg: "Not connected" });
            return undefined;
        }

        var response = await this.connection.exec(cmd);
        if (response.value instanceof Error) {
            throw response.value;
        }

        return response.value;
    }

    public async connectToPico(text: string): Promise<void> {
        let failed = false;
        const yargs = Yargs(text).fail((msg: string, err: Error) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        }).strict().exitProcess(false);

        yargs.option('local', {
            alias: 'l',
            type: 'boolean',
            description: 'Starts a local process to connect to. NOTE: Must set the "PSJ_LOCAL" environment variable to the pico-sdk-js executable.',
        });

        const args = await yargs.parseAsync();

        if (failed || args.help || args.version) {
            return;
        }

        if (this.connection !== null) {
            throw new Error("Already connected, run .disconnect close current connection first");
        }

        console.log("Connecting ... ");

        const localPath = process.env.PSJ_LOCAL;
        if (args.local && localPath) {
            console.log('Connecting to local process at %s', localPath);
            this.connection = new LocalProcessPicoSdkJsEngineConnection(localPath);
            this.connection.log = (msg) => this.logFn(msg);
            await this.connection.open();
        } else {
            throw new Error("Serial connections not yet supported.");
        }
    }

    private async disconnectFromPico(): Promise<void> {
        if (this.connection !== null) {
            console.log("Disconnecting ... ");
            await this.connection.close();
            this.connection = null;
        }
    }
}
