// import {describe, beforeEach, it, xit} from '@jest/globals';
// import { runner } from 'clet';

// describe('PSJ Flash Scenarios', () => {

//     beforeEach(async () => {
//         // Clear flash ram to start from scratch
//         await runner()
//         .fork('../dist/index.js', ['--auto-connect'], {})
//         .stdin('>', '.format --confirm')
//         .stdin('>', '.exit')
//         .code(0);
//     });

//     describe('.write', () => {

//         it('is able to write a small file', async () => {
//             // 10 byte file
//             const fileText = "1234567890";

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write test1.txt --content "${fileText}"`)
//             .stdout('Writing "static content" to "test1.txt"')
//             .stdout('10 bytes written')
//             .stdin('>', '.exit')
//             .code(0);
//         });

//         xit.failing('is able to write a large file', async () => {
//             // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/8

//             // 10kb file
//             const fileText = "1234567890".repeat(1024);

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write test2.txt --content "${fileText}"`)
//             .stdout('Writing "static content" to "test1.txt"')
//             .stdout('10240 bytes written')
//             .stdin('>', '.exit')
//             .code(0);
//         });

//         it('will clobber existing file', async () => {
//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write test1.txt --content "1234567890"`)
//             .stdin('>', `.write test1.txt --content "abcdefghij"`)
//             .stdin('>', '.read test1.txt')
//             .stdout("abcdefghij")
//             .stdout("10 bytes (1 segments) read")
//             .stdin('>', '.exit')
//             .code(0);

//         });
        
//         xit.failing('will error if file is larger than available space', async () => {
//             // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/8

//             // 1mb file
//             const fileText = "a".repeat(1048576);

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write test2.txt --content "${fileText}"`)
//             .stdout("ERR: Error opening 'dir/foo.txt' for write: -28")
//             .stdin('>', '.exit')
//             .code(0);
//         });
        
//         xit.failing('cannot write a hidden file', async () => {
//             // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/10

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write .hidden.txt --content "1234567890"`)
//             .stdout("ERR: Permission denied")
//             .stdin('>', '.exit')
//             .code(0);
//         });

//         it('cannot write a file to a subdirectory', async () => {
//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write ./dir/foo.txt --content "1234567890"`)
//             .stdout("ERR: Error opening 'dir/foo.txt' for write: -2")
//             .stdin('>', '.exit')
//             .code(0);
//         });

//     });

//     describe('.read', () => {

//         it('is able to read small existing file', async () => {
//             // 10 byte file
//             const fileText = "1234567890";

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write test1.txt --content "${fileText}"`)
//             .stdin('>', '.read test1.txt')
//             .stdout("1234567890")
//             .stdout("10 bytes (1 segments) read")
//             .stdin('>', '.exit')
//             .code(0);
//         });

//         xit.failing('is able to read large existing file', async () => {
//             // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/8

//             // 10kb file
//             const fileText = "1234567890".repeat(1024);

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write test2.txt --content "${fileText}"`)
//             .stdin('>', '.read test2.txt')
//             .stdout(fileText)
//             .stdout("11 bytes (1 segments) read")
//             .stdin('>', '.exit')
//             .code(0);
//         });

//         it('shows error for non-existing file', async () => {

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', '.read unknown.txt')
//             .stdout("ERR: File 'unknown.txt' not found")
//             .stdin('>', '.exit')
//             .code(0);
//         });

//         xit.failing('cannot read a hidden file', async () => {
//             // https://github.com/pico-sdk-js/pico-sdk-js-cli/issues/10

//             await runner()
//             .fork('../dist/index.js', ['--auto-connect'], {})
//             .stdin('>', `.write .hidden.txt --content "1234567890"`)
//             .stdin('>', '.read .hidden.txt')
//             .stdout("ERR: Permission denied")
//             .stdin('>', '.exit')
//             .code(0);
//         });
//     });

// });