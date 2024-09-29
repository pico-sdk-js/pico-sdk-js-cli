import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import fs from 'fs';
import path from 'path';
import { WriteCommandOptions } from '../PicoSdkJsEngineConnection';

export async function writeCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', 'Write a file to the connected device')
        .usage('.write <remote-path>')
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: 'The name to save as on the Pico device',
            normalize: true,
            demandOption: true
        })
        .options({
            'local-path': {
                alias: 'p',
                type: 'string',
                description: 'The local file to write to the Pico device',
                normalize: true
            },
            content: {
                alias: 'c',
                type: 'string',
                description: 'The contents of a file to write to the Pico device',
                conflicts: ['local-path']
            }
        })
        .fail((msg: string) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        })
        .strict()
        .exitProcess(false);

    yargs.example('.write file.js --local-path ./myFile.js', 'write the local "myFile.js" to the Pico with the file name "file.js".');
    yargs.example('.write file.js', 'write the local "file.js" to the Pico with the file name "file.js".');

    const args = await yargs.parseAsync();

    if (failed || args.help || args.version) {
        return;
    }

    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    const destName = args.remotePath;
    const srcName = args.content ? 'static content' : args.localPath ? path.resolve(args.localPath) : path.resolve(args.remotePath);
    const contents = args.content ?? new TextDecoder().decode(fs.readFileSync(srcName));
    const pageSize = 1024;
    const pages = Math.ceil(contents.length / pageSize);
    let bytesWritten = 0;

    console.log('Writing "%s" to "%s"', srcName, destName);

    for (let i = 0; i < pages; i++) {
        const options: WriteCommandOptions = {
            path: destName,
            mode: i === 0 ? 'create' : 'append',
            content: contents.substring(i * pageSize, (i + 1) * pageSize)
        };

        const { value } = await connection.write(options);
        bytesWritten += value.bytes;
    }

    console.log('%d bytes written', bytesWritten);
}
