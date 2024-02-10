#!/usr/bin/env node

/**
 * pico-sdk-js-cli
 * CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed
 *
 * @author jt000 <https://www.github.com/jt000>
 */

import repl, { REPLServer } from 'repl';
import pkg from '../package.json';
import { Context } from 'vm';

console.clear();
console.log(`${pkg.name} v${pkg.version}`);
console.log(`>> ${pkg.description}\n`);

const server = repl.start({
	eval: remoteEval,
	preview: false
});

function remoteEval(
	this: REPLServer,
	evalCmd: string,
	context: Context,
	file: string,
	cb: (err: Error | null, result: any) => void
): void {
	// Always return 3 :)
	cb(null, 3);
}
