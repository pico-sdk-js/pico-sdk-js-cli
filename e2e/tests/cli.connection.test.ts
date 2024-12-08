import {describe, it} from '@jest/globals';
import { runner } from 'clet';

describe('PSJ Connection Scenarios', () => {

    describe('command line args', () => {
        describe('--help', () => {
            it('shows help', async () => {
                await runner()
                    .fork('../dist/index.js', ['--help'], {})
                    .stdout(/^Welcome to @pico-sdk-js\/cli v([0-9]+\.[0-9]+\.[0-9]+)/)
                    .stdout(/>> CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed/)
                    .code(0);
            });
        });

        describe('--auto-connect', () => {
            it('connects to /dev/ttyACM0', async () => {
                await runner()
                    .fork('../dist/index.js', ['--auto-connect'], {})
                    .stdout(/Connecting to serial device at \/dev\/ttyACM0/)
                    .stdin(/>/, '.exit')
                    .code(0);
            });
        });
    });

    describe('.exit', () => {
        it('in REPL quits process', async () => {
            await runner()
                .fork('../dist/index.js', [], {})
                .stdin(/>/, '.exit')
                .code(0);
        });
    });

    describe('.ls', () => {
        it('shows error when not connected', async () => {
            await runner()
                .fork('../dist/index.js', [], {})
                .stdin(/>/, '.ls')
                .stdout(/Not connected/)
                .stdin(/>/, '.exit')
                .code(0);
        });
    });

    describe('.connect', () => {
        it('connects to /dev/ttyACM0', async () => {
            await runner()
                .fork('../dist/index.js', [], {})
                .stdin(/>/, '.connect')
                .stdout(/Connecting to serial device at \/dev\/ttyACM0/)
                .stdin(/>/, '.exit')
                .code(0);
        });
    });


    describe('.disconnect', () => {
        it('disconnects from /dev/ttyACM0', async () => {
            await runner()
                .fork('../dist/index.js', ['--auto-connect'], {})
                .stdin(/>/, '.disconnect')
                .stdout(/Disconnecting .../)
                .stdin(/>/, '.exit')
                .code(0);
        });
    });

});