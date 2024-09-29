import { SerialPort } from 'serialport';
import { CommandRequest, PicoSdkJsEngineConnection } from './PicoSdkJsEngineConnection';
import { LogLevel } from './psjLogger';
import assert from 'assert';

export class SerialPicoSdkJsEngineConnection extends PicoSdkJsEngineConnection {
    serialPort: SerialPort | null = null;
    readonly decoder: TextDecoder = new TextDecoder();

    constructor(public readonly device: string) {
        super();
    }

    public isOpen(): boolean {
        return this.serialPort !== null;
    }

    public open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.serialPort !== null) {
                reject('Connection already established');
                return;
            }

            const serialPort = new SerialPort({
                path: this.device,
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                rtsMode: 'toggle',
                autoOpen: false,
                endOnClose: true
            });

            serialPort.setDefaultEncoding('utf-8');
            serialPort.on('error', (err: Error) => {
                if (serialPort?.opening) {
                    this.log({ level: LogLevel.Trace, msg: `SRL: ${err.message}` });
                } else {
                    reject(err);
                }
            });

            serialPort.on('open', () => {
                let remainingData = '';

                this.log({ level: LogLevel.Trace, msg: 'SRL: "open" Event' });

                this.serialPort = serialPort;
                this.serialPort.removeAllListeners('error');
                this.serialPort.removeAllListeners('open');

                this.serialPort.on('close', () => this.onClose());
                this.serialPort.on('error', (err: Error) => this.onError(err));

                this.serialPort.on('data', (buffer) => {
                    const data = remainingData + this.decoder.decode(buffer);
                    const responses = data.split('\r\n');

                    if (!data.endsWith('\r\n')) {
                        remainingData = responses.pop() ?? '';
                    } else {
                        remainingData = '';
                    }

                    responses.forEach((response) => {
                        if (response) {
                            this.processResponseString(response);
                        }
                    });
                });

                resolve();
            });

            serialPort.open();
        });
    }

    public async close(): Promise<void> {
        if (this.serialPort !== null) {
            const quitCmd = new CommandRequest('quit');
            await this.sendCommand(quitCmd);

            this.serialPort.close();
            this.serialPort = null;
        }
    }

    protected sendCommandBase(cmd: CommandRequest): void {
        assert(this.serialPort !== null);

        this.serialPort.write(`${JSON.stringify(cmd)}\r`);
        this.serialPort.flush();
    }

    private onError(err: Error) {
        this.log({
            level: LogLevel.Error,
            msg: err.message
        });
        this.close();
    }

    private onClose() {
        this.log({
            level: LogLevel.Trace,
            msg: 'Serial port closed'
        });

        this.serialPort = null;
    }
}
