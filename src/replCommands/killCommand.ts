import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';

export async function killCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('*', 'Kills the currently running script on the device')
        .usage('.kill')
        .example('.kill', 'kills the currently running script on the device.')
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

    await connection.kill();
}
