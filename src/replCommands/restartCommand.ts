import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { t } from '../locales';

export async function restartCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', t('help-restart'))
        .usage('.restart')
        .example('.restart --hard', t('help-restart-example1'))
        .options({
            hard: {
                alias: 'h',
                type: 'boolean',
                description: t('help-restart-hard'),
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
        throw new Error(t('err-connection-not-open'));
    }

    await connection.restart(args.hard);

    console.log(t('msg-device-restarted'));

    if (args.hard) {
        // Connection broken when hard restart performed. Need to close the connection.
        await connection.close();
    }
}
