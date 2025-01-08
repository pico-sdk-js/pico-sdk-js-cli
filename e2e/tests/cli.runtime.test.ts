import {describe, afterEach, it, xit} from '@jest/globals';
import psjRunner from './psjRunner';

describe('PSJ Runtime Scenarios', () => {
    describe('repl', () => {

        it('executes javascript', async () => {

            await psjRunner()
            .start(['--skip-header'])
            .command(`const y = 1;`)
            .command(`y`)
            .assertSnapshot();
        });
    });

    describe('.restart', () => {

        it('soft will resets all data', async () => {

            await psjRunner()
            .start(['--skip-header'])
            .command(`const y = 1;`)
            .command(`.restart`)
            .command(`y`)
            .assertSnapshot();
        });

        it('hard will disconnect & reset data', async () => {

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
            await psjRunner()
            .start(['--skip-header'])
            .command('.format --confirm')
            .command(`.restart`);
        });

        it('is able to stop an executing script', async () => {

            const fileText = "let y=0; while(true) { y++; }";

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

            await psjRunner()
            .start(['--skip-header'])
            .command(`.kill`)
            .assertSnapshot();
        });

    });

    describe('.run', () => {

        afterEach(async () => {
            // Reset pico after each run
            await psjRunner()
            .start(['--skip-header'])
            .command('.format --confirm')
            .command(`.restart`);
        });
    
        it('is able to execute an existing file', async () => {

            const fileText = "print('success!');";

            await psjRunner()
            .start(['--skip-header'])
            .command(`.write test.js --content "${fileText}"`)
            .command(`.run test.js`)
            .assertSnapshot(); 
        });

        it('shows an error for a non-existing file', async () => {

            await psjRunner()
            .start(['--skip-header'])
            .command(`.run unknown.js`)
            .assertSnapshot(); 
        });

        xit.failing('shows an error for a hidden file', async () => {
            // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/10

            const fileText = "print('success!');";

            await psjRunner()
            .start(['--skip-header'])
            .command(`.write .hidden.js --content "${fileText}"`)
            .command(`.run hidden.js`)
            .assertSnapshot(); 
        });
    });
});