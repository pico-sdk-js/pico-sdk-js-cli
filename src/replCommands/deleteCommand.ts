import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { DeleteCommandOptions } from '../PicoSdkJsEngineConnection';
import { t } from '../locales';

export async function deleteCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', t('help-delete'))
        .usage('.delete <remote-path>')
        .example('.delete file.js', t('help-delete-example1'))
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: t('help-delete-remote-path'),
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
        throw new Error(t('err-connection-not-open'));
    }

    const srcName = args.remotePath;

    const options: DeleteCommandOptions = {
        path: srcName
    };

    await connection.delete(options);

    console.log(t('msg-file-deleted', srcName));
}
