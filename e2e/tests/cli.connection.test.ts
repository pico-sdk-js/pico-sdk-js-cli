import {describe, it} from '@jest/globals';
import psjRunner from './psjRunner';

describe('PSJ Connection Scenarios', () => {

    describe('command line args', () => {
        describe('--help', () => {
            it('shows help', async () => {
                await psjRunner()
                .start(['--help'])
                .assertExitCode(0)
                .assertSnapshot();     
            });
        });

        describe('--auto-connect', () => {
            it('connects to /dev/ttyACM0', async () => {
                await psjRunner()
                .start(['--auto-connect', '--skip-header'])
                .assertSnapshot();
            });
        });
    });

    describe('.exit', () => {
        it('in REPL quits process', async () => {
            await psjRunner()
            .start(['--skip-header'])
            .command('.exit')
            .assertSnapshot()
            .assertExitCode(0);
        });
    });

    describe('.ls', () => {
        it('shows error when not connected', async () => {
            await psjRunner()
            .start(['--skip-header'])
            .command('.ls')
            .assertSnapshot();
        });
    });

    describe('.connect', () => {
        it('connects to /dev/ttyACM0', async () => {
            await psjRunner()
                .start(['--skip-header'])
                .command('.connect')
                .assertSnapshot();
        });

        it('connection failure allows reconnect', async () => {
            await psjRunner()
                .start(['--skip-header'])
                .command('.connect -D /dev/ttyACM99')
                .command('.connect')
                .assertSnapshot();

        });
    });

});