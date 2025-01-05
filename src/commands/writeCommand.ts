import Yargs from 'yargs/yargs';
import { PsjReplServer } from '../psjReplServer';
import fs from 'node:fs/promises';
import path from 'path';
import { WriteCommandOptions } from '../PicoSdkJsEngineConnection';

interface IReaderResult {
    bytesRead: number;
    content: string;
}

interface IReader {
    srcName(): string;
    readNext(size: number): Promise<IReaderResult>;
}

class FileReader implements IReader {
    _srcName: string;
    _fileHandle?: fs.FileHandle;
    _decoder = new TextDecoder();

    constructor(filePath: string) {
        this._srcName = path.resolve(filePath);
    }

    srcName(): string {
        return this._srcName;
    }

    async readNext(size: number): Promise<IReaderResult> {
        if (!this._fileHandle) {
            this._fileHandle = await fs.open(this._srcName, 'r');
        }

        const buffer = Buffer.alloc(size);
        const result = await this._fileHandle.read(buffer, 0, size);

        if (result.bytesRead === 0) {
            return { bytesRead: 0, content: '' };
        }

        return {
            bytesRead: result.bytesRead,
            content: result.buffer.toString('utf-8', 0, result.bytesRead)
        };
    }
}

class StringReader implements IReader {
    _start: number;
    _length: number;

    constructor(private content: string) {
        this._start = 0;
        this._length = content.length;
    }

    srcName(): string {
        return 'static content';
    }

    async readNext(size: number): Promise<IReaderResult> {
        if (this._start >= this._length) {
            return {
                bytesRead: 0,
                content: ''
            };
        }

        const resultLength = Math.min(this._length - this._start, size);
        const resultData = this.content.substring(this._start, this._start + resultLength);
        this._start += resultLength;

        return {
            bytesRead: resultLength,
            content: resultData
        };
    }
}

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
    yargs.example('.write /tmp/file.js', 'write the local "/tmp/file.js" to the Pico with the file name "file.js".');

    const args = await yargs.parseAsync();

    if (failed || args.help || args.version) {
        return;
    }

    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    // if no localpath nor content is explicitly given, then remotepath is both the local path and remote file name
    const destName = args.localPath || args.content ? args.remotePath : path.basename(args.remotePath);
    const reader = args.content ? new StringReader(args.content) : args.localPath ? new FileReader(args.localPath) : new FileReader(args.remotePath);
    const pageSize = 1024;
    let bytesWritten = 0;
    let pageCount = 0;

    let bytes = await reader.readNext(pageSize);

    console.log('Writing "%s" to "%s"', reader.srcName(), destName);

    while (bytes.bytesRead > 0) {
        const options: WriteCommandOptions = {
            path: destName,
            mode: pageCount === 0 ? 'create' : 'append',
            content: bytes.content
        };

        const { value } = await connection.write(options);

        pageCount++;

        bytesWritten += value.bytes;

        bytes = await reader.readNext(pageSize);
    }

    console.log('%d bytes (%d segments) written', bytesWritten, pageCount);
}
