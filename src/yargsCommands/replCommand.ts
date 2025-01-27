import { Argv, ArgumentsCamelCase, CommandModule } from 'yargs';
import { logger, LogLevel } from '../psjLogger';
import { PsjReplServer } from '../psjReplServer';
import { ConnectionInfo, PicoSdkJsEngineConnection } from '../PicoSdkJsEngineConnection';
import { LocalProcessPicoSdkJsEngineConnection } from '../LocalProcessPicoSdkJsEngineConnection';
import { SerialPicoSdkJsEngineConnection } from '../SerialPicoSdkJsEngineConnection';
import { t } from '../locales';

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
            throw new Error(t('err-psjlocal-not-set'));
        }

        console.log(t('msg-psjlocal-connecting', localPath));
        connection = new LocalProcessPicoSdkJsEngineConnection(localPath);

        connectionInfo = await connection.open();
    } else if (connectionString === 'auto') {
        const devices = await SerialPicoSdkJsEngineConnection.list();
        console.log(t('msg-searching-devices'));
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
            throw new Error(t('msg-connection-not-found'));
        }
    } else {
        const device = connectionString;
        console.log(t('msg-connecting-device', device));
        connection = new SerialPicoSdkJsEngineConnection(device);

        connectionInfo = await connection.open();
    }

    if (connectionInfo !== null) {
        console.log(t('msg-device-connected', connectionInfo.version, connectionInfo.device));
    }

    return connection;
}

export class ReplCommand implements CommandModule<IReplCommandOptions, IReplCommandOptions> {
    public readonly aliases = [];
    public readonly command = ['repl', '$0'];
    public readonly deprecated = false;
    public readonly describe = t('args-repl');

    public builder(yargs: Argv): Argv<IReplCommandOptions> {
        return yargs
            .option('log-level', {
                alias: 'll',
                type: 'string',
                choices: ['error', 'warning', 'debug', 'trace'],
                description: t('args-repl-log-level'),
                default: 'error'
            })
            .option('connection', {
                alias: 'c',
                type: 'string',
                description: t('args-repl-connection'),
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
