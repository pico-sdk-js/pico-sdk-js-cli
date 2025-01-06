import { Argv, ArgumentsCamelCase, CommandModule } from 'yargs';
import { LogLevel } from '../psjLogger';
import { PsjReplServer } from '../psjReplServer';
import { connectToPico } from '../replCommands/connectCommand';

interface IReplCommandOptions {
    'auto-connect': boolean;
    'log-level': string;
    local?: boolean;
}

const logLevels: Record<string, LogLevel> = {
    error: LogLevel.Error,
    warning: LogLevel.Warning,
    debug: LogLevel.Debug,
    trace: LogLevel.Trace
};

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
            .option('auto-connect', {
                alias: 'ac',
                type: 'boolean',
                description: 'Automatically connects on start.',
                default: false
            })
            .option('local', {
                alias: 'l',
                type: 'boolean',
                description: 'Starts a local process to connect to. NOTE: Must set the "PSJ_LOCAL" environment variable to the pico-sdk-js executable.'
            });
    }

    public async handler(args: ArgumentsCamelCase<IReplCommandOptions>) {
        const server = new PsjReplServer();
        server.setLogLevel(logLevels[args.logLevel]);

        if (args.autoConnect) {
            await connectToPico(server, args.local ? '--local' : '');
        }

        server.start();
    }
}

const replCommand = new ReplCommand();
export default replCommand;
