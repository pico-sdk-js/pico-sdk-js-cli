import { randomInt } from "crypto";
import { LogMessage } from "./psjLogger";

export class CommandRequest<T = {}> {
    public cmd: string;
    public etag: number = randomInt(0, 0xFFFFFFFF);
    public args: T|null = null;

    constructor(cmd: string, args?: T) {
        this.cmd = cmd;
        this.args = args ?? null;
    }
}

export interface CommandResponse<T = any> {
    cmd: string;
    etag: number | undefined;
    value: T;
}

export class CommandError extends Error {
    constructor(public readonly code: number, message: string) {
        super(message);
    }
}

interface CommandResponseHandler {
    resolve: (value: CommandResponse | PromiseLike<CommandResponse>) => void, 
    reject: (reason?: any) => void
};

export interface WriteCommandOptions {
    path: string;
    content: string;
    mode: "create" | "append" | undefined;
}

export interface ReadCommandOptions {
    path: string;
    seg: number;
}

export interface DeleteCommandOptions {
    path: string;
}

export interface LsCommandResponse extends CommandResponse<{ name: string; size: number; }[]> {}
export interface StatsCommandResponse extends CommandResponse<Record<string, any>> {}
export interface WriteCommandResponse extends CommandResponse<{bytes: number}> {}
export interface ReadCommandResponse extends CommandResponse<{size: number, seg: number, nSegs: number, content: string}> {}

export abstract class PicoSdkJsEngineConnection {

    private etags: Record<number, CommandResponseHandler> = {};

    public abstract open(): Promise<void>;
    public abstract close(): Promise<void>;
    public abstract isOpen(): boolean;

    protected sendCommand(cmd: CommandRequest): Promise<CommandResponse> {
        return new Promise<CommandResponse>((resolve, reject) =>{
            if (!this.isOpen())
            {
                reject("Connection not open");
                return;
            }

            this.etags[cmd.etag] = {
                resolve: resolve,
                reject: reject
            };

            this.sendCommandBase(cmd);
        });
    }

    protected abstract sendCommandBase(cmd: CommandRequest): void;

    public log: (log:LogMessage) => void = () => {};

    public exec(cmd: string): Promise<CommandResponse> {
        let execCmd = new CommandRequest<{code:string}>("exec");
        execCmd.args = { code: cmd };
        return this.sendCommand(execCmd);
    }

    public reset(): Promise<CommandResponse> {
        let resetCmd = new CommandRequest("reset");
        return this.sendCommand(resetCmd);
    }

    public ls(): Promise<LsCommandResponse> {
        let lsCmd = new CommandRequest("ls");
        return this.sendCommand(lsCmd);
    }

    public read(options: ReadCommandOptions): Promise<ReadCommandResponse> {
        let cmd = new CommandRequest("read", options);
        return this.sendCommand(cmd);
    }

    public write(options: WriteCommandOptions): Promise<WriteCommandResponse> {
        let cmd = new CommandRequest("write", options);
        return this.sendCommand(cmd);
    }

    public delete(options: DeleteCommandOptions): Promise<CommandResponse> {
        let cmd = new CommandRequest("delete", options);
        return this.sendCommand(cmd);
    }

    public format(): Promise<CommandResponse> {
        let cmd = new CommandRequest("format");
        return this.sendCommand(cmd);
    }

    public stats(): Promise<StatsCommandResponse> {
        let cmd = new CommandRequest("stats");
        return this.sendCommand(cmd);
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

