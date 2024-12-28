import {describe, it} from '@jest/globals';

import psjRunner from './psjRunner';

describe('PSJ Runtime Scenarios', () => {

    describe('repl', () => {

        it('executes javascript', async () => {

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`const y = 1;`)
            .command(`y`)
            .assertSnapshot();
        });
    });

    describe('.restart', () => {

        it('soft will resets all data', async () => {

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`const y = 1;`)
            .command(`.restart`)
            .command(`y`)
            .assertSnapshot();
        });

        it('hard will disconnect & reset data', async () => {

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
            .command(`const y = 1;`)
            .command(`.restart --hard`)
            .pause(1000)
            .command(`.connect`)
            .command(`y`)
            .assertSnapshot();
        });
    });

    describe('.stats', () => {

        it('will return stats from pico', async () => {

            await psjRunner()
            .start(['--auto-connect', '--skip-header'])
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
});