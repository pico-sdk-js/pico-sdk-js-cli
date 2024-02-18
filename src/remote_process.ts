import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { randomInt } from "crypto";
import path from "path";

class CommandRequest<T = {}> {
    public cmd: string;
    public etag: number = randomInt(0, 0xFFFFFFFF);
    public args: T|null = null;

    constructor(cmd: string) {
        this.cmd = cmd;
    }
}

export enum LogLevel {
    Error = 0,
    Warning = 1,
    Debug = 2,
    Trace = 3
}

export interface LogMessage {
    level: LogLevel,
    msg: string
}

interface CommandResponse<T = any> {
    cmd: string;
    etag: number | undefined;
    value: T;
}

class CommandError extends Error {
    constructor(public readonly code: number, message: string) {
        super(message);
    }
}

interface CommandResponseHandler {
    resolve: (value: CommandResponse | PromiseLike<CommandResponse>) => void, 
    reject: (reason?: any) => void
};

export abstract class PicoSdkJsEngineConnection {

    protected etags: Record<number, CommandResponseHandler> = {};

    public abstract open(): Promise<void>;
    public abstract close(): Promise<void>;
    protected abstract sendCommand(cmd: CommandRequest): Promise<CommandResponse>;

    public log: (log:LogMessage) => void = () => {};

    public ping(): Promise<CommandResponse> {
        let pingCmd = new CommandRequest("ping");
        return this.sendCommand(pingCmd);
    }

    public exec(cmd: string): Promise<CommandResponse> {
        let execCmd = new CommandRequest<{code:string}>("exec");
        execCmd.args = { code: cmd };
        return this.sendCommand(execCmd);
    }

    protected processResponseString(response: string): void {
        let cmdResponse: CommandResponse;
        
        try {
            cmdResponse = JSON.parse(response) as CommandResponse;
        } catch (e) {
            console.log(response);
            return;
        }

        if (cmdResponse.etag) {
            const handler = this.etags[cmdResponse.etag];
            delete this.etags[cmdResponse.etag];

            if (handler) {
                if (cmdResponse.value?.error) {
                    const errorResponse = new CommandError(cmdResponse.value?.error, cmdResponse.value?.message);
                    handler.reject(errorResponse);
                } else {
                    handler.resolve(cmdResponse);
                }
            }
            else {
                console.error("UNKNOWN ETAG: #%d", cmdResponse.etag);
            }
        } else {
            if (cmdResponse.cmd === "log") {
                const logResponseValue = cmdResponse.value as LogMessage;
                this.log(logResponseValue);
            }
        }
    }
}

export class LocalProcessPicoSdkJsEngineConnection extends PicoSdkJsEngineConnection {
	private readonly abortController = new AbortController();
	private process: ChildProcessWithoutNullStreams | null = null;
    private interval: NodeJS.Timeout|null = null;
	
	constructor(private readonly path: string) {
        super();
	}

	public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const cwd = path.dirname(this.path);
            const procPath = "./" + path.basename(this.path);

            const childprocess = spawn(procPath, ['--echo_off'], {
                shell: true,
                cwd: cwd,
                stdio: 'pipe',
                signal: this.abortController.signal
            });

            childprocess.once("spawn", () => {
                this.process = childprocess;
                
                childprocess.stdout.setEncoding('utf8');

                childprocess.stdout.on('data', (data: string) => {
                    const responses = data.split('\n');
                    responses.forEach(response => {
                        if (response) {
                            this.processResponseString(response);
                        }
                    });
                });

                childprocess.on("exit", (code) => {
                    if (this.interval) {
                        clearInterval(this.interval);
                        this.interval = null;
                    }

                    this.process = null;
                });
                
                this.interval = setInterval(() => {
                    childprocess.stdout.read();
                }, 1000);

                resolve();
            });

        });
	}

	public async close(): Promise<void> {
        if (this.process !== null) {
            const quitCmd = new CommandRequest("quit");
            await this.sendCommand(quitCmd);
        }
    }

    protected sendCommand(cmd: CommandRequest<{}>): Promise<CommandResponse> {
        return new Promise<CommandResponse>((resolve, reject) =>{
            if (this.process === null)
            {
                reject("Not connected");
                return;
            }

            this.etags[cmd.etag] = {
                resolve: resolve,
                reject: reject
            };

            this.process.stdin.write(`${JSON.stringify(cmd)}\n`);
        });
    }
}