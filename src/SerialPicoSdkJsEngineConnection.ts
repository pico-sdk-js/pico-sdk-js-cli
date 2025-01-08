import { SerialPort } from 'serialport';
import { CommandRequest, PicoSdkJsEngineConnection, StatsCommandResponse } from './PicoSdkJsEngineConnection';
import { logger, LogLevel } from './psjLogger';
import assert from 'assert';

const errorRegex = /!#(?<error>[a-zA-Z0-9\-_]+)#!/;

export class SerialPicoSdkJsEngineConnection extends PicoSdkJsEngineConnection {
    serialPort: SerialPort | null = null;
    isConnected = false;
    readonly decoder: TextDecoder = new TextDecoder();

    constructor(public readonly device: string) {
        super();
    }

    public static async list(): Promise<string[]> {
        const ports = await SerialPort.list();
        return ports.map((p) => p.path);
    }

    public isOpen(): boolean {
        return this.serialPort !== null;
    }

    public async open(): Promise<void> {
        if (this.serialPort !== null) {
            throw 'Connection already established';
        }

        await this.openInternal();

        let stats: StatsCommandResponse;
        try {
            stats = await this.stats();
        } catch (error) {
            this.close();
            throw 'Pico-SDK-JS not running on device';
        }

        this.onLog({ level: LogLevel.Trace, msg: `Connection opened to ${stats.value['version']}` });
        this.isConnected = true;
    }

    private openInternal(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
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
                    this.onLog({ level: LogLevel.Trace, msg: `SRL: ${err.message}` });
                } else {
                    reject(err);
                }
            });

            serialPort.on('open', () => {
                let remainingData = '';

                this.onLog({ level: LogLevel.Trace, msg: 'SRL: "open" Event' });

                this.serialPort = serialPort;
                this.serialPort.removeAllListeners('error');
                this.serialPort.removeAllListeners('open');

                this.serialPort.on('close', () => this._onClose());
                this.serialPort.on('error', (err: Error) => this._onError(err));

                this.serialPort.on('data', (buffer) => {
                    const data = remainingData + this.decoder.decode(buffer);
                    const commError = errorRegex.exec(data);
                    const responses = data.split('\r\n');

                    if (commError?.groups?.error) {
                        this.processError(commError?.groups.error);
                        remainingData = '';
                        this.close();
                        return;
                    }

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
            if (this.isConnected) {
                try {
                    const quitCmd = new CommandRequest('quit');
                    await this.sendCommand(quitCmd);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (error: any) {
                    logger.logMsg(LogLevel.Error, error.toString());
                }
            }

            this.serialPort.close();
            this.serialPort = null;
        }
    }

    protected sendCommandBase(cmd: CommandRequest): void {
        assert(this.serialPort !== null);

        this.serialPort.write(`${JSON.stringify(cmd)}\r`);
        this.serialPort.flush();
    }

    private _onError(err: Error) {
        this.onLog({
            level: LogLevel.Error,
            msg: err.message
        });
        this.close();
    }

    private _onClose() {
        this.onLog({
            level: LogLevel.Trace,
            msg: 'Serial port closed'
        });

        this.onClose();

        this.serialPort = null;
    }
}
