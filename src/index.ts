#!/usr/bin/env node

/**
 * pico-sdk-js-cli
 * CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed
 *
 * @author jt000 <https://www.github.com/jt000>
 */

import pkg from '../package.json';
import { PsjReplServer } from './psjReplServer';
import * as yargs from 'yargs';
import { LogLevel } from './remote_process';

console.clear();
console.log(`${pkg.name} v${pkg.version}`);
console.log(`>> ${pkg.description}\n`);

const logLevels: Record<string,LogLevel> = { 'error': LogLevel.Error, 'warning': LogLevel.Warning, 'debug': LogLevel.Debug, 'trace': LogLevel.Trace };

(async function () {
    const args = yargs.strict()
        .option('log-level', {
            alias: 'll',
            type: 'string',
            choices: ['error', 'warning', 'debug', 'trace'],
            description: 'Sets the log level of the output',
            default: 'error'
        }).option('auto-connect', {
            alias: 'ac',
            type: 'boolean',
            description: 'Automatically connects on start'
        }).option('local', {
            alias: 'l',
            type: 'boolean',
            description: 'Starts a local process to connect to. NOTE: Must set the "PSJ_LOCAL" environment variable to the pico-sdk-js executable.',
        }).parseSync();

    const server = new PsjReplServer();
    server.setLogLevel(logLevels[args.logLevel]);

    if (args.autoConnect) {
        await server.connectToPico(args.local ? '--local' : '');
    }

    server.start();
})();
