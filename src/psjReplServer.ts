import repl, { REPLCommandAction, REPLServer } from 'repl';
import minimist from "minimist";
import { Context } from "vm";
import { PicoSdkJsEngineConnection, LogLevel, LogMessage, LocalProcessPicoSdkJsEngineConnection } from "./remote_process";
import { logger } from './psjLogger';

export class PsjReplServer {
    private connection: PicoSdkJsEngineConnection | null = null;
    private maxLogLevel: LogLevel = LogLevel.Error;
    private server: REPLServer;
    private commandInProgress: boolean = false;
    
    constructor() {
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
    
        this.server.defineCommand("ping", {
            action: (text: string) => this.wrapCommand(() => this.pingPico())
        });    
    }

    private logFn(msg: LogMessage) {
        if (msg.level > this.maxLogLevel) return;

        logger.log(msg);

        if (!this.commandInProgress) {
            this.server.displayPrompt(true);
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
            this.server.displayPrompt();
        }
    }

    private async exec(cmd: string): Promise<any> {
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

    private async connectToPico(text: string): Promise<void> {
        const unknownArgs: string[] = [];
        const args = minimist(text.split(' '), {
            boolean: ["local"],
            unknown: (arg: string) => { if (arg) unknownArgs.push(arg); return false; }
        });

        if (unknownArgs.length > 0) {
            throw new Error(`Unknown argument(s): ${unknownArgs}`);
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

    private async pingPico(): Promise<void> {
        if (this.connection === null) {
            throw new Error("Not connected");
        }

        await this.connection.ping();
        console.log("pong");
    }
}

export function startReplServer(): PsjReplServer {
    return new PsjReplServer();
}