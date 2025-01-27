import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import fs from 'fs';
import path from 'path';
import { ReadCommandOptions } from '../PicoSdkJsEngineConnection';
import { t } from '../locales';

export async function readCommand(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text)
        .command('* <remote-path>', t('help-read'))
        .usage('.read <remote-path>')
        .positional('remote-path', {
            alias: 'r',
            type: 'string',
            description: t('help-read-remote-path'),
            normalize: true,
            demandOption: true
        })
        .options({
            'local-path': {
                alias: 'p',
                type: 'string',
                description: t('help-read-local-path'),
                normalize: true
            },
            overwrite: {
                alias: 'o',
                type: 'boolean',
                description: t('help-read-overwrite'),
                implies: ['local-path']
            }
        })
        .example('.read file.js --local-path ./myFile.js', t('help-read-example1'))
        .example('.read file.js', t('help-read-example2'))
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
    const destName = args.localPath ? path.resolve(args.localPath) : null;
    let contents = '';
    let bytesRead = 0;

    console.log(t('msg-reading-file', srcName));

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
        console.log(t('msg-writing-output', destName));
        fs.writeFileSync(destName, contents, { flush: true, flag: args.overwrite ? 'w' : 'wx' });
    } else {
        console.log(contents);
    }

    console.log(t('msg-file-read', bytesRead, currentSegment));
}
