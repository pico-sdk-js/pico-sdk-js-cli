import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';

export async function restartCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', 'restart the Pico Device and loaded program')
        .usage('.restart')
        .options({
            hard: {
                alias: 'h',
                type: 'boolean',
                description: 'do a hard restart forcing the entire pico device to reboot.',
                default: false
            }
        })
        .fail((msg: string) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        })
        .strict()
        .exitProcess(false);

    yargs.example('.restart --hard', 'Perform a hard restart on the connected device.');

    const args = await yargs.parseAsync();

    if (failed || args.help || args.version) {
        return;
    }

    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    await connection.restart(args.hard);

    console.log('Device restarting');

    if (args.hard) {
        // Connection broken when hard restart performed. Need to close the connection.
        await connection.close();
    }
}
