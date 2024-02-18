#!/usr/bin/env node

/**
 * pico-sdk-js-cli
 * CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed
 *
 * @author jt000 <https://www.github.com/jt000>
 */

import pkg from '../package.json';
import { startReplServer } from './psjReplServer';

console.clear();
console.log(`${pkg.name} v${pkg.version}`);
console.log(`>> ${pkg.description}\n`);

const server = startReplServer();