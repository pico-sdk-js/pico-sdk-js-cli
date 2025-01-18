import { Argv, ArgumentsCamelCase, CommandModule } from 'yargs';
import { logger, LogLevel } from '../psjLogger';
import { PsjReplServer } from '../psjReplServer';
import { ConnectionInfo, PicoSdkJsEngineConnection } from '../PicoSdkJsEngineConnection';
import { LocalProcessPicoSdkJsEngineConnection } from '../LocalProcessPicoSdkJsEngineConnection';
import { SerialPicoSdkJsEngineConnection } from '../SerialPicoSdkJsEngineConnection';

interface IReplCommandOptions {
    connection: string;
    'log-level': string;
    local?: boolean;
}

const logLevels: Record<string, LogLevel> = {
    error: LogLevel.Error,
    warning: LogLevel.Warning,
    debug: LogLevel.Debug,
    trace: LogLevel.Trace
};

async function getConnection(connectionString: string): Promise<PicoSdkJsEngineConnection> {
    let connection: PicoSdkJsEngineConnection | null = null;
    let connectionInfo: ConnectionInfo | null = null;

    if (connectionString === 'local') {
        const localPath = process.env.PSJ_LOCAL;
        if (!localPath) {
            throw new Error("Local path not defined. Must set environment variable 'PSJ_LOCAL' to the path of the pico-sdk-js executable.");
        }

        console.log('Connecting to local process at %s', localPath);
        connection = new LocalProcessPicoSdkJsEngineConnection(localPath);

        connectionInfo = await connection.open();
    } else if (connectionString === 'auto') {
        const devices = await SerialPicoSdkJsEngineConnection.list();
        console.log('Searching for device running Pico-SDK-JS engine...');
        for (const device of devices) {
            try {
                connection = new SerialPicoSdkJsEngineConnection(device);
                connectionInfo = await connection.open();
                break;
            } catch {
                connection = null;
                connectionInfo = null;
            }
        }

        if (connection === null) {
            throw new Error(`Valid connection to Pico-SDK-JS not found.`);
        }
    } else {
        const device = connectionString;
        console.log('Connecting to serial device at %s', device);
        connection = new SerialPicoSdkJsEngineConnection(device);

        connectionInfo = await connection.open();
    }

    if (connectionInfo !== null) {
        console.log(`Connected to Pico-SDK-JS Engine v${connectionInfo.version} at '${connectionInfo.device}'`);
    }

    return connection;
}

class ReplCommand implements CommandModule<IReplCommandOptions, IReplCommandOptions> {
    public readonly aliases = [];
    public readonly command = ['repl', '$0'];
    public readonly deprecated = false;
    public readonly describe = 'Starts the REPL server to connect to the Raspberry Pi Pico';

    public builder(yargs: Argv): Argv<IReplCommandOptions> {
        return yargs
            .option('log-level', {
                alias: 'll',
                type: 'string',
                choices: ['error', 'warning', 'debug', 'trace'],
                description: 'Sets the log level of the output.',
                default: 'error'
            })
            .option('connection', {
                alias: 'c',
                type: 'string',
                description: 'Specifies the target device to connect to: "local" for a local process, "auto" for the first available device, or a specific serial port path (e.g., /dev/tty.XXX or COM1).',
                default: 'auto'
            });
    }

    public async handler(args: ArgumentsCamelCase<IReplCommandOptions>) {
        try {
            const engineConnection = await getConnection(args.connection);
            const server = new PsjReplServer(engineConnection);
            server.setLogLevel(logLevels[args.logLevel]);

            server.start();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            logger.logMsg(LogLevel.Error, error.toString());
        }
    }
}

const replCommand = new ReplCommand();
export default replCommand;
