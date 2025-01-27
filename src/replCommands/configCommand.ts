import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { t } from '../locales';

export async function configCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <config-name> [<config-value]', t('help-config'))
        .usage('.config <config-name> [<config-value>]')
        .example('.config autorun', t('help-config-example1'))
        .example('.config autorun index.js', t('help-config-example2'))
        .example('.config autorun --unset', t('help-config-example3'))
        .positional('config-name', {
            alias: 'n',
            type: 'string',
            description: t('help-config-config-name'),
            normalize: true,
            demandOption: true
        })
        .positional('config-value', {
            alias: 'v',
            type: 'string',
            description: t('help-config-config-value'),
            normalize: true,
            demandOption: false
        })
        .options({
            unset: {
                alias: 'u',
                type: 'boolean',
                description: t('help-config-unset'),
                conflicts: ['config-value']
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

    if (args.unset) {
        await connection.config_write({ name: args.configName, value: null });
        console.log(t('msg-config-unset', args.configName));
    } else if (args.configValue) {
        await connection.config_write({ name: args.configName, value: args.configValue });
        console.log(t('msg-config-set', args.configName, args.configValue));
    } else {
        const result = await connection.config_read({ name: args.configName });
        console.log(result.value);
    }
}
