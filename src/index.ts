#!/usr/bin/env node

/**
 * pico-sdk-js-cli
 * CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed
 *
 * @author jt000 <https://www.github.com/jt000>
 */

import pkg from '../package.json';
import { connectToPico } from './commands/connectCommand';
import { LogLevel } from './psjLogger';
import { PsjReplServer } from './psjReplServer';
import * as yargs from 'yargs';

const logLevels: Record<string, LogLevel> = {
    error: LogLevel.Error,
    warning: LogLevel.Warning,
    debug: LogLevel.Debug,
    trace: LogLevel.Trace
};

(async function () {
    const args = yargs
        .strict()
        .option('log-level', {
            alias: 'll',
            type: 'string',
            choices: ['error', 'warning', 'debug', 'trace'],
            description: 'Sets the log level of the output.',
            default: 'error'
        })
        .option('auto-connect', {
            alias: 'ac',
            type: 'boolean',
            description: 'Automatically connects on start.'
        })
        .option('local', {
            alias: 'l',
            type: 'boolean',
            description: 'Starts a local process to connect to. NOTE: Must set the "PSJ_LOCAL" environment variable to the pico-sdk-js executable.'
        })
        .option('skip-header', {
            type: 'boolean',
            description: 'Do not output the process header.',
            default: false
        })
        .parseSync();

    const server = new PsjReplServer();
    server.setLogLevel(logLevels[args.logLevel]);

    console.clear();

    if (!args['skip-header']) {
        console.log(`
Welcome to ${pkg.name} v${pkg.version}
>> ${pkg.description}
 
Type ".help" for more information.`);
    }

    if (args.autoConnect) {
        await connectToPico(server, args.local ? '--local' : '');
    }

    server.start();
})();
