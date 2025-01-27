import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { t } from '../locales';

export async function formatCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', t('help-format'))
        .usage('.format')
        .example('.format --confirm', t('help-format-example1'))
        .options({
            confirm: {
                alias: 'y',
                type: 'boolean',
                description: t('help-format-confirm'),
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
        throw new Error(t('err-connection-not-open'));
    }

    await connection.format();

    console.log(t('msg-device-formatted'));
}
