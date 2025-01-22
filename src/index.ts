#!/usr/bin/env node

/**
 * pico-sdk-js-cli
 * CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed
 *
 * @author jt000 <https://www.github.com/jt000>
 */

import yargs from 'yargs';
import { yargsSetup } from './yargsCommands/coreCommand';
import { ReplCommand } from './yargsCommands/replCommand';
import { getOsLocale } from './locales';

(async function () {
    const osLocale = await getOsLocale();
    await yargsSetup(yargs(process.argv.slice(2)), osLocale)
        .command(new ReplCommand())
        .parse();
})();
