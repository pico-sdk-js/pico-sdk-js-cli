import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import fs from 'fs';
import path from 'path';
import { ReadCommandOptions } from '../PicoSdkJsEngineConnection';

export async function readCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', 'Read a file from the connected device')
        .usage('.read <remote-path>')
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: 'The name to load from the Pico device',
            normalize: true,
            demandOption: true
        })
        .options({
            'local-path': {
                alias: 'p',
                type: 'string',
                description: 'The local file to write from the Pico device',
                normalize: true
            },
            overwrite: {
                alias: 'o',
                type: 'boolean',
                description: 'Overwrites existing files if they already exist with the same path name',
                implies: ['local-path']
            }
        })
        .fail((msg: string) => {
            failed = true;
            console.error(msg);
            yargs.showHelp();
        })
        .strict()
        .exitProcess(false);

    yargs.example('.read file.js --local-path ./myFile.js', 'read from the Pico with the file name "file.js" and save the local "myFile.js".');
    yargs.example('.read file.js', 'read from the Pico with the file name "file.js" and write to teh screen.');

    const args = await yargs.parseAsync();

    if (failed || args.help || args.version) {
        return;
    }

    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    const srcName = args.remotePath;
    const destName = args.localPath ? path.resolve(args.localPath) : null;
    let contents = '';
    let bytesRead = 0;

    console.log('Reading from "%s"', srcName);

    let currentSegment = 0;
    let maxSegments = 1;

    while (currentSegment < maxSegments) {
        const options: ReadCommandOptions = {
            path: srcName,
            seg: currentSegment
        };

        const { value } = await connection.read(options);
        if (value.size === 0) {
            break;
        }

        contents += value.content;
        bytesRead += value.size;
        maxSegments = value.nSegs;
        currentSegment++;
    }

    if (destName) {
        console.log('Writing output to "%s"', destName);
        fs.writeFileSync(destName, contents, { flush: true, flag: args.overwrite ? 'w' : 'wx' });
    } else {
        console.log(contents);
    }

    console.log('%d bytes (%d segments) read', bytesRead, currentSegment);
}
