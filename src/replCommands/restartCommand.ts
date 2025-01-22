import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { t } from '../locales';

export async function restartCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', t('restart the Pico Device and loaded program'))
        .usage('.restart')
        .example('.restart --hard', t('Perform a hard restart on the connected device.'))
        .options({
            hard: {
                alias: 'h',
                type: 'boolean',
                description: t('do a hard restart forcing the entire pico device to reboot.'),
                default: false
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
        throw new Error(t('Not connected, run .connect to connect to a device running Pico-Sdk-JS.'));
    }

    await connection.restart(args.hard);

    console.log(t('Device restarting'));

    if (args.hard) {
        // Connection broken when hard restart performed. Need to close the connection.
        await connection.close();
    }
}
