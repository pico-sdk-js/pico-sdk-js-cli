import { describe, afterEach, it } from '@jest/globals';
import psjRunner from './psjRunner';

describe('PSJ Runtime Scenarios', () => {
    describe('repl', () => {
        it('executes javascript', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`const y = 1;`)
                .command(`y`)
                .assertSnapshot();
        });
    });

    describe('.restart', () => {
        it('soft will resets all data', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`const y = 1;`)
                .command(`.restart`)
                .command(`y`)
                .assertSnapshot();
        });

        it('hard will disconnect & reset data', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`const y = 1;`)
                .command(`.restart --hard`)
                .pause(1000)
                .assertSnapshot();
        });
    });

    describe('.stats', () => {
        it('will return stats from pico', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.stats`)
                .assertInStdout("name            :  pico-sdk-js")
                .assertInStdout(/version\s+:\s+\d+\.\d+\.\d+/)
                .assertInStdout("running         :  null")
                .assertInStdout(/total ram\s+:\s+\d+/)
                .assertInStdout(/used ram\s+:\s+\d+/)
                .assertInStdout(/available ram\s+:\s+\d+/)
                .assertInStdout(/total bytes\s+:\s+\d+/)
                .assertInStdout(/available bytes\s+:\s+\d+/)
                .assertInStdout("js engine       :  JerryScript")
                .assertInStdout("js version      :  1")
                .assertInStdout(/js bytes\s+:\s+\d+/)
                .assertInStdout(/js peak bytes\s+:\s+\d+/)
                .assertInStdout(/js size\s+:\s+\d+/);
        });
    });

    describe('.kill', () => {
        afterEach(async () => {
            // Reset pico after each run
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command('.format --confirm')
                .command(`.restart`);
        });

        it('is able to stop an executing script', async () => {
            const fileText = 'let y=0; while(true) { y++; }';

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test.js --content "${fileText}"`)
                .command(`.run test.js`)
                .command(`.stats`)
                .assertInStdout("running         :  test.js")
                .resetStdout()
                .command(`.kill`)
                .assertSnapshot()
                .command(`.stats`)
                .assertInStdout("running         :  null");
        });

        it('shows an error when nothing running', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.kill`)
                .assertSnapshot();
        });
    });

    describe('.run', () => {
        afterEach(async () => {
            // Reset pico after each run
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command('.format --confirm')
                .command(`.restart`);
        });

        it('is able to execute when existing already running', async () => {
            const fileText = "print('success!');";

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test.js --content "${fileText}"`)
                .command(`.run test.js`)
                .assertSnapshot();
        });

        it('is able to kill to execute a new script', async () => {
            const file1Text = 'let y=0; while(true) { y++; }';
            const file2Text = "print('success!');";

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test1.js --content "${file1Text}"`)
                .command(`.write test2.js --content "${file2Text}"`)
                .command(`.run test1.js`)
                .pause(100)
                .command('y > 0')
                .command(`.run test2.js`)
                .pause(100)
                .command('y > 0')
                .assertSnapshot();
        });

        it('shows an error for a non-existing file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.run unknown.js`)
                .assertSnapshot();
        });

        it('shows an error for a hidden file', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.run .hidden.js`)
                .assertSnapshot();
        });
    });
});
