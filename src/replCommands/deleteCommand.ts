import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import { DeleteCommandOptions } from '../PicoSdkJsEngineConnection';

export async function deleteCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', 'Delete a file from the connected device')
        .usage('.delete <remote-path>')
        .example('.delete file.js', 'deletes from the Pico with the file name "file.js".')
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: 'The name of the file to delete from the Pico device',
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
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    const srcName = args.remotePath;

    const options: DeleteCommandOptions = {
        path: srcName
    };

    await connection.delete(options);

    console.log('Deleted "%s"', srcName);
}
