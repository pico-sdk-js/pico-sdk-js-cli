import {expect} from '@jest/globals';
import {execaNode, ResultPromise} from 'execa';

type PromiseFn = () => PromiseLike<void>;


class PsjTestRunner implements PromiseLike<void> {
    private _abortController: AbortController = new AbortController();
    private _proc?: ResultPromise;
    private _exitCode?: number;
    private _isIdle = false;
    private _stdOut: string[] = [];
    private _steps: PromiseFn[] = [];

    public start(args?: string[]): PsjTestRunner {
        this._steps.push(async () => {
            // start();
            this._proc = execaNode('../dist/index.js', args ?? [], {
                cancelSignal: this._abortController.signal,
                gracefulCancel: true
            });
            this._proc.stdout?.on('data', (data) => {

                const lines: string[] = data.toString().split('\n');
                if (lines.length > 0) {
                    this._stdOut.push(...lines);
                    this._isIdle = (lines[lines.length - 1] === '> ');
                }
            });
            this._proc.on('exit', (code: number) => {
                this._exitCode = code;
                this._proc = undefined;
            });
        });

        this.waitForIdle();

        return this;
    }

    public command(cmd: string): PsjTestRunner {

        this.waitForIdle();
        this._steps.push(async () => {
            // command();
            this._stdOut[this._stdOut.length - 1] += cmd;

            this._proc?.stdin?.write(cmd);
            this._proc?.stdin?.write('\n');

            this._isIdle = false;
        });
        this.waitForIdle();
        return this;
    }

    public waitForIdle(): PsjTestRunner {
        this._steps.push(() => {
            // waitForIdle();
            return new Promise((resolve) => {
                if (this._isIdle) {
                    resolve();
                    return;
                }

                const intervalId = setInterval(() => {
                    if (!this._proc || this._isIdle) {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 50);
            });
        });

        return this;
    }

    public assertSnapshot(): PsjTestRunner {
        this._steps.push(async () => {
            // assertSnapshot();
            const stdOut = this._stdOut.join('\n');
            expect(stdOut).toMatchSnapshot('stdOut');
            this._stdOut = [];
        });

        return this;
    };

    public assertExit(): PsjTestRunner {
        this.waitForIdle();
        
        this._steps.push(async () => {
            // assertExit();
            expect(this._proc).toBeUndefined();
        });

        return this;
    }

    public assertExitCode(code: number): PsjTestRunner {
        this.assertExit();

        this._steps.push(async () => {
            // assertExitCode()
            expect(this._exitCode).toBe(code);
        });

        return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async then<TResult1 = void, TResult2 = never>(onfulfilled?: (() => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
        try {
            while (this._steps.length > 0) {
                const step = this._steps.shift();
                if (step) {
                    await step();
                }
            }
            
            if (this._proc) {
                this.command('.exit');
            }

            this.assertExitCode(0);

            while (this._steps.length > 0) {
                const step = this._steps.shift();
                if (step) {
                    await step();
                }
            }
            
            if (this._proc) {
                this._proc.kill();
            }

            return onfulfilled?.call(this) as TResult1;
        } catch (error) {
            return onrejected?.call(this, [error]) as TResult2;
        }
    }
}

export default function psjRunner() {
    return new PsjTestRunner();
}
