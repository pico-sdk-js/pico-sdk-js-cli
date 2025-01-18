import { describe, it } from '@jest/globals';
import psjRunner from './psjRunner';

describe('PSJ Connection Scenarios', () => {
    describe('command line args', () => {
        describe('--help', () => {
            it('shows help', async () => {
                // prettier-ignore
                await psjRunner()
                    .start(['--help'])
                    .assertExitCode(0)
                    .assertSnapshot();
            });
        });

        describe('--connection', () => {
            it('connects to /dev/ttyACM0', async () => {
                // prettier-ignore
                await psjRunner()
                    .start(['--skip-header', '--connection', '/dev/ttyACM0'])
                    .assertSnapshot();
            });

            it('searches for connection', async () => {
                // prettier-ignore
                await psjRunner()
                    .start(['--skip-header', '--connection', 'auto'])
                    .assertSnapshot();
            });

            it('fails connection to invalid device', async () => {
                // prettier-ignore
                await psjRunner()
                    .start(['--skip-header', '--connection', '/dev/ttyACM999'])
                    .assertSnapshot();
            });
        });
    });

    describe('.exit', () => {
        it('in REPL quits process', async () => {
            // prettier-ignore
            await psjRunner()
                .start(['--skip-header'])
                .command('.exit')
                .assertSnapshot()
                .assertExitCode(0);
        });
    });
});
