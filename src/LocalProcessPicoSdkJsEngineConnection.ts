import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import { CommandRequest, PicoSdkJsEngineConnection } from './PicoSdkJsEngineConnection';
import { LogLevel } from './psjLogger';
import assert from 'assert';

export class LocalProcessPicoSdkJsEngineConnection extends PicoSdkJsEngineConnection {
    private readonly abortController = new AbortController();
    private process: ChildProcessWithoutNullStreams | null = null;
    private interval: NodeJS.Timeout | null = null;

    constructor(private readonly path: string) {
        super();
    }

    public isOpen(): boolean {
        return this.process !== null;
    }

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.process !== null) {
                reject('Process already running');
                return;
            }

            const cwd = path.dirname(this.path);
            const procPath = './' + path.basename(this.path);

            const childprocess = spawn(procPath, ['--echo_off'], {
                shell: true,
                cwd: cwd,
                stdio: 'pipe',
                signal: this.abortController.signal
            });

            childprocess.once('spawn', () => {
                let carryover = '';

                this.process = childprocess;

                childprocess.stdout.setEncoding('utf8');

                childprocess.stdout.on('data', (data: string) => {
                    data = carryover + data;
                    const responses: string[] = data.split('\n');

                    if (responses.length > 0 && data[data.length - 1] !== '\n') {
                        carryover = responses.pop() as string;
                    } else {
                        carryover = '';
                    }

                    responses.forEach((response) => {
                        if (response) {
                            this.processResponseString(response);
                        }
                    });
                });

                childprocess.on('exit', (code) => {
                    if (this.interval) {
                        clearInterval(this.interval);
                        this.interval = null;
                    }

                    this.log({
                        level: code === 0 ? LogLevel.Trace : LogLevel.Error,
                        msg: `Process exited with code ${code}`
                    });

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
            const quitCmd = new CommandRequest('quit');
            await this.sendCommand(quitCmd);
        }
    }

    protected sendCommandBase(cmd: CommandRequest<object>) {
        assert(this.process !== null);

        this.process.stdin.write(`${JSON.stringify(cmd)}\n`);
    }
}
