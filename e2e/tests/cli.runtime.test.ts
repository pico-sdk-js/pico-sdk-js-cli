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
});