import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';

export async function formatCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', 'Delete all files and reformat the attached device')
        .usage('.format')
        .example('.format --confirm', 'delete all files and reformats the attached device without additional confirmation.')
        .options({
            confirm: {
                alias: 'y',
                type: 'boolean',
                description: 'confirm that all files will be deleted and the device will be formatted.',
                demandOption: true
            }
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

    await connection.format();

    console.log('Device formatted');
}
