import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { RunCommandOptions } from '../PicoSdkJsEngineConnection';

export async function runCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', 'Execute a file from the connected device')
        .usage('.run <remote-path>')
        .example('.run file.js', 'Execute a file stored on the Pico with the file name "file.js".')
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: 'The name to load from the Pico device',
            normalize: true,
            demandOption: true
        })
        .fail((msg: string) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        })
        .strict()
        .version(false)
        .exitProcess(false);

    const args = await yargs.parseAsync();

    if (failed || args.help || args.version) {
        return;
    }

    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    const srcName = args.remotePath;
    console.log('Executing "%s"', srcName);

    const options: RunCommandOptions = {
        path: srcName
    };

    await connection.run(options);
}
