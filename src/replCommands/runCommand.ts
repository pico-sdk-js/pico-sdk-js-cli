import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { RunCommandOptions } from '../PicoSdkJsEngineConnection';
import { t } from '../locales';

export async function runCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', t('help-run'))
        .usage('.run <remote-path>')
        .example('.run file.js', t('help-run-example1'))
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: t('help-run-remote-path'),
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
    console.log(t('msg-script-executing', srcName));

    const options: RunCommandOptions = {
        path: srcName
    };

    await connection.run(options);
}
