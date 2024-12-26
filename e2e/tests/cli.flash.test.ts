import {describe, beforeEach, it, xit} from '@jest/globals';
import psjRunner from './psjRunner';

describe('PSJ Flash Scenarios', () => {

    beforeEach(async () => {
        // Clear flash ram to start from scratch
        await psjRunner()
        .start(['--auto-connect', '--skip-header'])
        .command('.format --confirm');
    });

    describe('.write', () => {

        it('is able to write a small file', async () => {
            // 10 byte file
            const fileText = "1234567890";

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write test1.txt --content "${fileText}"`)
            .assertSnapshot();
        });

        xit.failing('is able to write a large file', async () => {
            // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/8

            // 10kb file
            const fileText = "1234567890".repeat(1024);

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write test2.txt --content "${fileText}"`)
            .assertSnapshot();
        });

        it('will clobber existing file', async () => {
            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write test1.txt --content "1234567890"`)
            .command(`.write test1.txt --content "abcdefghij"`)
            .command('.read test1.txt')
            .assertSnapshot();

        });
        
        xit.failing('will error if file is larger than available space', async () => {
            // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/8

            // 1mb file
            const fileText = "a".repeat(1048576);

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write test2.txt --content "${fileText}"`)
            .assertSnapshot();
        });
        
        xit.failing('cannot write a hidden file', async () => {
            // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/10

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write .hidden.txt --content "1234567890"`)
            .assertSnapshot();
        });

        it('cannot write a file to a subdirectory', async () => {
            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write ./dir/foo.txt --content "1234567890"`)
            .assertSnapshot();
        });

    });

    describe('.read', () => {

        it('is able to read small existing file', async () => {
            // 10 byte file
            const fileText = "1234567890";

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write test1.txt --content "${fileText}"`)
            .command('.read test1.txt')
            .assertSnapshot();
        });

        xit.failing('is able to read large existing file', async () => {
            // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/8

            // 10kb file
            const fileText = "1234567890".repeat(1024);

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write test2.txt --content "${fileText}"`)
            .command('.read test2.txt')
            .assertSnapshot();
        });

        it('shows error for non-existing file', async () => {

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command('.read unknown.txt')
            .assertSnapshot();
        });

        xit.failing('cannot read a hidden file', async () => {
            // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/10

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`.write .hidden.txt --content "1234567890"`)
            .command('.read .hidden.txt')
            .assertSnapshot();
        });
    });

});