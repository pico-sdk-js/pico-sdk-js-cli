import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';

export async function configCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <config-name> [<config-value]', 'Get or set a config option to the Pico')
        .usage('.config <config-name> [<config-value>]')
        .example('.config autorun', 'reads the "autorun" config setting from the device.')
        .example('.config autorun index.js', 'sets the "autorun" config setting to "index.js".')
        .example('.config autorun --unset', 'unsets the "autorun" config setting the default value.')
        .positional('config-name', {
            alias: 'n',
            type: 'string',
            description: 'The name of the config setting to get or set.',
            normalize: true,
            demandOption: true
        })
        .positional('config-value', {
            alias: 'v',
            type: 'string',
            description: 'The value of the config setting to set.',
            normalize: true,
            demandOption: false
        })
        .options({
            unset: {
                alias: 'u',
                type: 'boolean',
                description: 'Removes a config setting resetting the value back to the default.',
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
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    if (args.unset) {
        await connection.config_write({ name: args.configName, value: null });
        console.log(`Unset config option ${args.configName}`);
    } else if (args.configValue) {
        await connection.config_write({ name: args.configName, value: args.configValue });
        console.log(`Set config option ${args.configName} to "${args.configValue}"`);
    } else {
        const result = await connection.config_read({ name: args.configName });
        console.log(result.value);
    }
}
