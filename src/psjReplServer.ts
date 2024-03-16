import repl, { REPLServer } from 'repl';
import { Context } from 'vm';
import Yargs from 'yargs/yargs';
import { LocalProcessPicoSdkJsEngineConnection } from './LocalProcessPicoSdkJsEngineConnection';
import { CommandError, PicoSdkJsEngineConnection } from './PicoSdkJsEngineConnection';
import { LogLevel, LogMessage, logger } from './psjLogger';
import { SerialPicoSdkJsEngineConnection } from './SerialPicoSdkJsEngineConnection';

export class PsjReplServer {
    private connection?: PicoSdkJsEngineConnection;
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
            const closePromise = this.connection?.close();
            this.server = undefined;
            this.connection = undefined;
            
            await closePromise;
        });

        this.server.on("reset", async () => this.wrapCommand(() => this.resetContextOnPico()));
    
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

    public async connectToPico(text: string): Promise<void> {
        let failed = false;
        const yargs = Yargs(text).options({
            local: {
                alias: 'l',
                type: 'boolean',
                description: 'Starts a local process to connect to. NOTE: Must set the "PSJ_LOCAL" environment variable to the pico-sdk-js executable.',
                hidden: true
            },
            device: {
                alias: 'D',
                type: 'string',
                description: 'The device name to connect to.',
                // default: '/dev/ttyACM0'
            }
        }).fail((msg: string, err: Error) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        }).strict().exitProcess(false);


        yargs.conflicts('local', 'device');

        yargs.example('.connect --device /dev/ttyACM0', 'connect to the "/dev/ttyACM0" device.');

        const args = await yargs.parseAsync();

        if (failed || args.help || args.version) {
            return;
        }

        if (this.connection) {
            throw new Error("Already connected, run .disconnect close current connection first");
        }

        console.log("Connecting ... ");

        if (args.local) {
            const localPath = process.env.PSJ_LOCAL;
            if (!localPath) {
                throw new Error("Local path not defined. Must set environment variable 'PSJ_LOCAL' to the path of the pico-sdk-js executable.");
            }

            console.log('Connecting to local process at %s', localPath);
            this.connection = new LocalProcessPicoSdkJsEngineConnection(localPath);
            this.connection.log = (msg) => this.logFn(msg);
            await this.connection.open();
        } else {
            const device = args.device ?? '/dev/ttyACM0';
            console.log('Connecting to serial device at %s', device);
            this.connection = new SerialPicoSdkJsEngineConnection(device);
            this.connection.log = (msg) => this.logFn(msg);
            await this.connection.open();
        }
    }

    private async disconnectFromPico(): Promise<void> {
        if (this.connection) {
            console.log("Disconnecting ... ");
            await this.connection.close();
            this.connection = undefined;
        }
    }
}
