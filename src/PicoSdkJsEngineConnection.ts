import { randomInt } from 'crypto';
import { LogMessage } from './psjLogger';
import Version from './version';
import runtimeConfig from './runtimeConfig.json';

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
    timeoutId: NodeJS.Timeout;
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

export interface ConnectionInfo {
    device: string;
    version: Version;
}

export type LsCommandResponse = CommandResponse<{ name: string; size: number }[]>;
export type StatsCommandResponse = CommandResponse<Record<string, object>>;
export type WriteCommandResponse = CommandResponse<{ bytes: number }>;
export type ReadCommandResponse = CommandResponse<{ size: number; seg: number; nSegs: number; content: string }>;

export abstract class PicoSdkJsEngineConnection {
    private etags: Record<number, CommandResponseHandler> = {};
    protected isConnected = false;

    public abstract close(): Promise<void>;
    public abstract isOpen(): boolean;

    protected abstract sendCommandBase(cmd: CommandRequest): void;
    protected abstract openInternal(): Promise<Pick<ConnectionInfo, 'device'>>;

    // eslint @typescript-eslint/no-empty-function: "ignore"
    public onLog: (log: LogMessage) => void = () => {};

    // eslint @typescript-eslint/no-empty-function: "ignore"
    public onClose: () => void = () => {};

    public async open(): Promise<ConnectionInfo> {
        const minRequiredVersion = new Version(runtimeConfig.minimumEngineVersion);

        const connectionInfo: ConnectionInfo = {
            device: (await this.openInternal()).device,
            version: new Version('999.999.999')
        };

        let stats: StatsCommandResponse;
        try {
            stats = await this.stats();
            if ('version' in stats.value) {
                const verString = stats.value['version'];
                if (typeof verString === 'string') {
                    connectionInfo.version = new Version(verString);
                }
            }
        } catch (error) {
            this.close();
            throw 'Pico-SDK-JS not running on device';
        }

        if (!minRequiredVersion.isCompatible(connectionInfo.version)) {
            this.close();
            throw `Pico-SDK-JS Engine v${connectionInfo.version} is not compatible with this version of the CLI which requires v${minRequiredVersion}.`;
        }

        this.isConnected = true;

        return connectionInfo;
    }

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
        const restartCmd = new CommandRequest<{ hard: 0 | 1 }>('restart');
        restartCmd.args = { hard: hard ? 1 : 0 };
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

    protected sendCommand<T = CommandResponse>(cmd: CommandRequest, timeout = 2000): Promise<T> {
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
                reject: reject,
                timeoutId: setTimeout(() => {
                    const handler = this.etags[cmd.etag];
                    if (handler) {
                        /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete --
                         * A delete is required here due to cmdResponse.etag being a dynamic value
                         * and already confirmed to exist.
                         **/
                        delete this.etags[cmd.etag];
                        handler.reject(`TIMEOUT ERROR: Command response took over ${timeout}ms`);
                    }
                }, timeout)
            };

            this.sendCommandBase(cmd);
        });
    }

    protected processError(errorMsg: string): void {
        for (const etag in this.etags) {
            const handler = this.etags[etag];

            if (handler) {
                /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete --
                 * A delete is required here due to cmdResponse.etag being a dynamic value
                 * and already confirmed to exist.
                 **/
                delete this.etags[etag];
                clearTimeout(handler.timeoutId);
                handler.reject(`REMOTE ERROR: ${errorMsg}`);
            }
        }
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

                clearTimeout(handler.timeoutId);

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
                this.onLog(logResponseValue);
            }
        }
    }
}
