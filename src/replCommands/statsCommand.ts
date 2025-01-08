import chalk from 'chalk';
import { PsjReplServer } from '../psjReplServer';
import Yargs from 'yargs/yargs';

export async function statsCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', 'Get information on the connected device')
        .usage('.stats')
        .fail((msg: string) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        })
        .strict()
        .exitProcess(false);

    yargs.example('.stats', 'get information on the connected device.');

    const args = await yargs.parseAsync();

    if (failed || args.help || args.version) {
        return;
    }

    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    const { value } = await connection.stats();

    Object.getOwnPropertyNames(value).forEach((element) => {
        console.log('  ', chalk.bold(element.padEnd(15)), ': ', value[element]);
    });
}
