import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { t } from '../locales';

export async function lsCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', t('List files stored on the connected device'))
        .usage('.ls')
        .example('.ls', t('list files stored on the connected device.'))
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

    const response = await connection.ls();

    console.log(t('total %d file(s)', response.value.length.toString()));
    if (response.value.length > 0) {
        console.table(response.value);
    }
}
