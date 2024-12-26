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

    // describe('.exit', () => {
    //     it('in REPL quits process', async () => {
    //         await psjRunner()
    //         .start(['--skip-header'])
    //         .stdin('>', '.exit')
    //         .assertSnapshot()
    //         .code(0);
    //     });
    // });

    // describe('.ls', () => {
    //     it('shows error when not connected', async () => {
    //         await psjRunner()
    //         .start(['--skip-header'])
    //         .stdin('>', '.ls')
    //         .stdin('>', '.exit')
    //         .assertSnapshot()
    //         .code(0);
    //     });
    // });

    // describe('.connect', () => {
    //     it('connects to /dev/ttyACM0', async () => {
    //         await runner()
    //             .fork('../dist/index.js', [], {})
    //             .stdin('>', '.connect')
    //             .stdout('Connecting to serial device at /dev/ttyACM0')
    //             .stdin('>', '.exit')
    //             .code(0);
    //     });

    //     it('connection failure allows reconnect', async () => {
    //         await runner()
    //             .fork('../dist/index.js', [], {})
    //             .stdin('>', '.connect -D /dev/ttyACM99')
    //             .stdout('Error: No such file or directory, cannot open /dev/ttyACM99')
    //             .stdin('>', '.connect')
    //             .stdout('Connecting to serial device at /dev/ttyACM0')
    //             .stdin('>', '.exit')
    //             .code(0);

    //     });
    // });


    // describe('.disconnect', () => {
    //     it('disconnects from /dev/ttyACM0', async () => {
    //         await runner()
    //             .fork('../dist/index.js', ['--auto-connect'], {})
    //             .stdin('>', '.disconnect')
    //             .stdout('Disconnecting ...')
    //             .stdin('>', '.exit')
    //             .code(0);
    //     });
    // });

});