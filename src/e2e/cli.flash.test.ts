import { describe, beforeEach, it } from '@jest/globals';

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import psjRunner from './psjRunner';

describe('PSJ Flash Scenarios', () => {
    beforeEach(async () => {
        // Clear flash ram to start from scratch
        // prettier-ignore
        await psjRunner()
            .start(['--skip-header'])
            .command('.format --confirm');
    });

    describe('.write', () => {
        it('is able to write a small file', async () => {
            // 10 byte file
            const fileText = '1234567890';

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test1.txt --content "${fileText}"`)
                .assertSnapshot();
        });

        it('is able to write a large file', async () => {
            // 10kb file
            const fileText = '1234567890'.repeat(1024);

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test2.txt --content "${fileText}"`)
                .assertSnapshot();
        });

        it('will clobber existing file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test1.txt --content "1234567890"`)
                .command(`.write test1.txt --content "abcdefghij"`)
                .command('.read test1.txt')
                .assertSnapshot();
        });

        it('will write a JS file', async () => {
            const fileText = `(()=>{"use strict";print("hello world!")})();
//# sourceMappingURL=index.js.map`;

            const tempFile = path.join(os.tmpdir(), 'index.js');
            await fs.writeFile(tempFile, fileText);

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write index.js -p "${tempFile}"`)
                .command('.run index.js')
                .assertSnapshot();
        });

        it('will write a JS file from another directory without path arguement', async () => {
            const fileText = `(()=>{"use strict";print("hello world!")})();
//# sourceMappingURL=index.js.map`;

            const tempFile = path.join(os.tmpdir(), 'index.js');
            await fs.writeFile(tempFile, fileText);

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write ${tempFile}`)
                .command('.run index.js')
                .assertSnapshot();
        });

        it('will error if file is larger than available space', async () => {
            // 1mb file
            const fileText = 'a'.repeat(1048576);

            const tempFile = path.join(os.tmpdir(), 'test2.txt');
            await fs.writeFile(tempFile, fileText);

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test2.txt --local-path "${tempFile}"`)
                .assertSnapshot();
        }, 150000);

        it('cannot write a hidden file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write .hidden.txt --content "1234567890"`)
                .assertSnapshot();
        });

        it('cannot write a file to a subdirectory', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write ./dir/foo.txt --content "1234567890"`)
                .assertSnapshot();
        });
    });

    describe('.read', () => {
        it('is able to read small existing file', async () => {
            // 10 byte file
            const fileText = '1234567890';

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test1.txt --content "${fileText}"`)
                .command('.read test1.txt')
                .assertSnapshot();
        });

        it('is able to read large existing file', async () => {
            // 10kb file
            const fileText = '1234567890'.repeat(1024);

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test2.txt --content "${fileText}"`)
                .command('.read test2.txt')
                .assertSnapshot();
        });

        it('shows error for non-existing file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command('.read unknown.txt')
                .assertSnapshot();
        });

        it('cannot read a hidden file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write .hidden.txt --content "1234567890"`)
                .command('.read .hidden.txt')
                .assertSnapshot();
        });
    });

    describe('.delete', () => {
        it('is able to delete an existing file', async () => {
            // 10 byte file
            const fileText = '1234567890';

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test1.txt --content "${fileText}"`)
                .command(`.delete test1.txt`)
                .assertSnapshot();
        });

        it('shows error for non-existing file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.delete test1.txt`)
                .assertSnapshot();
        });

        it('cannot delete a hidden file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command('.delete .hidden.txt')
                .assertSnapshot();
        });
    });
});
