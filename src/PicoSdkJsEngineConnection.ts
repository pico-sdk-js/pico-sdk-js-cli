import { randomInt } from 'crypto';
import { LogMessage } from './psjLogger';

export class CommandRequest<T = object> {
    public cmd: string;
    public etag: number = randomInt(0, 0xffffffff);
    public args: T | null = null;

    constructor(cmd: string, args?: T) {
        this.cmd = cmd;
        this.args = args ?? null;
    }
}

export interface CommandResponse<T = object> {
    cmd: string;
    etag: number | undefined;
    value: T;
}

export class CommandError extends Error {
    constructor(
        public readonly error: number,
        message: string
    ) {
        super(message);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
     * Verifies if the value is of a particular type
    **/
    static isCommandError(obj: any): boolean {
        return !!(obj?.error && obj?.message);
    }
}

interface CommandResponseHandler {
    resolve: (value: CommandResponse | PromiseLike<CommandResponse>) => void;
    reject: (reason?: unknown) => void;
}

export interface WriteCommandOptions {
    path: string;
    content: string;
    mode: 'create' | 'append' | undefined;
}

export interface ReadCommandOptions {
    path: string;
    seg: number;
}

export interface RunCommandOptions {
    path: string;
}

export interface DeleteCommandOptions {
    path: string;
}

export type LsCommandResponse = CommandResponse<{ name: string; size: number }[]>;
export type StatsCommandResponse = CommandResponse<Record<string, object>>;
export type WriteCommandResponse = CommandResponse<{ bytes: number }>;
export type ReadCommandResponse = CommandResponse<{ size: number; seg: number; nSegs: number; content: string }>;

export abstract class PicoSdkJsEngineConnection {
    private etags: Record<number, CommandResponseHandler> = {};

    public abstract open(): Promise<void>;
    public abstract close(): Promise<void>;
    public abstract isOpen(): boolean;

    protected sendCommand<T = CommandResponse>(cmd: CommandRequest): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!this.isOpen()) {
                reject('Connection not open');
                return;
            }

            this.etags[cmd.etag] = {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
                 * Any is required below in order to allow conversions from CommandResponse<object> to
                 * more specific CommandResponse types like LsCommandResponse.
                 **/
                resolve: resolve as any,
                reject: reject
            };

            this.sendCommandBase(cmd);
        });
    }

    protected abstract sendCommandBase(cmd: CommandRequest): void;

    // eslint @typescript-eslint/no-empty-function: "ignore"
    public log: (log: LogMessage) => void = () => {};

    public exec(cmd: string): Promise<CommandResponse> {
        const execCmd = new CommandRequest<{ code: string }>('exec');
        execCmd.args = { code: cmd };
        return this.sendCommand(execCmd);
    }

    public run(options: RunCommandOptions): Promise<CommandResponse> {
        const runCmd = new CommandRequest<RunCommandOptions>('run', options);
        return this.sendCommand(runCmd);
    }

    public restart(hard: boolean): Promise<CommandResponse> {
        const restartCmd = new CommandRequest<{ hard: 0|1 }>('restart');
        restartCmd.args = { hard : hard ? 1 : 0 };
        return this.sendCommand(restartCmd);
    }

    public kill(): Promise<CommandResponse> {
        const cmd = new CommandRequest('kill');
        return this.sendCommand(cmd);
    }

    public ls(): Promise<LsCommandResponse> {
        const lsCmd = new CommandRequest('ls');
        return this.sendCommand<LsCommandResponse>(lsCmd);
    }

    public read(options: ReadCommandOptions): Promise<ReadCommandResponse> {
        const cmd = new CommandRequest('read', options);
        return this.sendCommand(cmd);
    }

    public write(options: WriteCommandOptions): Promise<WriteCommandResponse> {
        const cmd = new CommandRequest('write', options);
        return this.sendCommand(cmd);
    }

    public delete(options: DeleteCommandOptions): Promise<CommandResponse> {
        const cmd = new CommandRequest('delete', options);
        return this.sendCommand(cmd);
    }

    public format(): Promise<CommandResponse> {
        const cmd = new CommandRequest('format');
        return this.sendCommand(cmd);
    }

    public stats(): Promise<StatsCommandResponse> {
        const cmd = new CommandRequest('stats');
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

            if (handler) {
                /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete --
                 * A delete is required here due to cmdResponse.etag being a dynamic value
                 * and already confirmed to exist.
                 **/
                delete this.etags[cmdResponse.etag];

                if (CommandError.isCommandError(cmdResponse.value)) {
                    handler.reject(cmdResponse.value);
                } else {
                    handler.resolve(cmdResponse);
                }
            } else {
                console.error('UNKNOWN ETAG: #%d', cmdResponse.etag);
            }
        } else {
            if (cmdResponse.cmd === 'log') {
                const logResponseValue = cmdResponse.value as LogMessage;
                this.log(logResponseValue);
            }
        }
    }
}
