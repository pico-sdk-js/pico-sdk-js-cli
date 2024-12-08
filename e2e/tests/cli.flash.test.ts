import {describe, beforeEach, it} from '@jest/globals';
import { runner } from 'clet';

describe('PSJ Flash Scenarios', () => {

    beforeEach(async () => {
        // Clear flash ram to start from scratch
        await runner()
        .fork('../dist/index.js', ['--auto-connect'], {})
        .stdin(/>/, '.format --confirm')
        .stdin(/>/, '.exit')
        .code(0);
    });

    describe('.write', () => {

        it('is able to write a small file', async () => {});
        it('is able to write a large file', async () => {});
        it('will error if file is larger than available space', async () => {});
        it('will clobber existing file', async () => {});
        it('cannot write a hidden file starting with "."', async () => {});
        it('cannot write a file to a subdirectory', async () => {});

    });

    describe('.read', () => {

        it('is able to read small existing file', async () => {
            // 10 byte file
            const fileText = "1234567890";

            // Clear flash ram to start from scratch
            await runner()
            .fork('../dist/index.js', ['--auto-connect'], {})
            .stdin(/>/, `.write test1.txt --content "${fileText}"`)
            .stdin(/>/, '.read test1.txt')
            .stdout("1234567890")
            .stdout("10 bytes (1 segments) read")
            .stdin(/>/, '.exit')
            .code(0);
        });

        it('is able to read large existing file', async () => {
            // 10kb file
            const fileText = "1234567890".repeat(1024);

            // Clear flash ram to start from scratch
            await runner()
            .fork('../dist/index.js', ['--auto-connect'], {})
            .stdin(/>/, `.write test2.txt --content "${fileText}"`)
            .stdin(/>/, '.read test2.txt')
            .stdout(fileText)
            .stdout("11 bytes (1 segments) read")
            .stdin(/>/, '.exit')
            .code(0);
        });

        it('shows error for non-existing file', async () => {});
        it('cannot read hidden file starting with "."', async () => {});

    });

});