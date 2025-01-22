import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { t } from '../locales';

export async function formatCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', t('Delete all files and reformat the attached device'))
        .usage('.format')
        .example('.format --confirm', t('delete all files and reformats the attached device without additional confirmation.'))
        .options({
            confirm: {
                alias: 'y',
                type: 'boolean',
                description: t('confirm that all files will be deleted and the device will be formatted.'),
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
        throw new Error(t('Not connected, run .connect to connect to a device running Pico-Sdk-JS.'));
    }

    await connection.format();

    console.log(t('Device formatted'));
}
