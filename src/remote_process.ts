import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { error } from "console";
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

    public ping(): Promise<CommandResponse> {
        let pingCmd = new CommandRequest("ping");
        return this.sendCommand(pingCmd);
    }

    protected processResponseString(response: string): void {
        const cmdResponse: CommandResponse = JSON.parse(response) as CommandResponse;
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
            console.log(cmdResponse);
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

            const childprocess = spawn(procPath, {
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