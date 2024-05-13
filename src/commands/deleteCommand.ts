import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import fs from 'fs';
import path from 'path';
import { DeleteCommandOptions, ReadCommandOptions } from '../PicoSdkJsEngineConnection';

export async function deleteCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', 'Delete a file from the connected device')
        .usage('.delete <remote-path>')
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: 'The name of the file to delete from the Pico device',
            normalize: true,
            demandOption: true
        })
        .fail((msg: string, err: Error) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        })
        .strict()
        .exitProcess(false);

    yargs.example('.delete file.js', 'deletes from the Pico with the file name "file.js".');

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

    const { value } = await connection.delete(options);

    console.log('Deleted "%s"', srcName);
}
