#!/usr/bin/env node

/**
 * pico-sdk-js-cli
 * CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed
 *
 * @author jt000 <https://www.github.com/jt000>
 */

import yargs from 'yargs';
import { yargsSetup } from './yargsCommands/coreCommand';
import replCommand from './yargsCommands/replCommand';

(async function () {
    await yargsSetup(yargs(process.argv.slice(2)))
        .command(replCommand)
        .parse();
})();
