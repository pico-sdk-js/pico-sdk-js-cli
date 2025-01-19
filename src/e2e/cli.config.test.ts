import { describe, beforeEach, it } from '@jest/globals';
import psjRunner from './psjRunner';

describe('PSJ Runtime Scenarios', () => {
    describe('.config', () => {
        beforeEach(async () => {
            // Reset pico after each run
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command('.format --confirm')
                .command(`.restart`);
        });

        it('initially has no autorun setting', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command('.config autorun')
                .assertSnapshot();
        });

        it('can set an autorun file', async () => {
            const fileText = "print('success!');";

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test.js --content "${fileText}"`)
                .command('.config autorun test.js')
                .command(`.restart`)
                .pause(100)
                .assertSnapshot();
        });

        it('can unset an autorun file', async () => {
            const fileText = "print('success!');";

            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command(`.write test.js --content "${fileText}"`)
                .command('.config autorun test.js')
                .command(`.restart`)
                .pause(100)
                .command('.config autorun --unset')
                .command(`.restart`)
                .assertSnapshot();
        });
    });
});
