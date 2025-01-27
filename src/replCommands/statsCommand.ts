import chalk from 'chalk';
import { PsjReplServer } from '../psjReplServer';
import Yargs from 'yargs/yargs';
import { t } from '../locales';

export async function statsCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', t('help-stats'))
        .usage('.stats')
        .example('.stats', t('help-stats-example1'))
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

    const { value } = await connection.stats();

    Object.getOwnPropertyNames(value).forEach((element) => {
        console.log('  ', chalk.bold(element.padEnd(15)), ': ', value[element]);
    });
}
