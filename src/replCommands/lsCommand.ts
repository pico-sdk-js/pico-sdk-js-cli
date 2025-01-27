import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { t } from '../locales';

export async function lsCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', t('help-ls'))
        .usage('.ls')
        .example('.ls', t('help-ls-example1'))
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

    const response = await connection.ls();

    console.log(t('msg-files-listed', response.value.length));
    if (response.value.length > 0) {
        console.table(response.value);
    }
}
