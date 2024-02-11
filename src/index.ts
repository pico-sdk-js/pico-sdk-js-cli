#!/usr/bin/env node

/**
 * pico-sdk-js-cli
 * CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed
 *
 * @author jt000 <https://www.github.com/jt000>
 */

import pkg from '../package.json';
import repl from 'repl';
import { LocalProcessPicoSdkJsEngineConnection, PicoSdkJsEngineConnection } from './remote_process';
import { type Context } from 'vm';
import minimist from 'minimist';

console.clear();
console.log(`${pkg.name} v${pkg.version}`);
console.log(`>> ${pkg.description}\n`);

let connection: PicoSdkJsEngineConnection | null = null;

const server = repl.start({
	eval: remoteEval,
	preview: false
});

server.on("exit", async () => {
	await connection?.close();
});

server.defineCommand("connect", {
	help: "Connect to a Pico running Pico-Sdk-JS",
	action: connectToPico
});

server.defineCommand("disconnect", {
	help: "Disconnect a Pico running Pico-sdk-JS",
	action: disconnectFromPico
});

server.defineCommand("ping", {
	action: pingPico
});

function remoteEval(
	this: repl.REPLServer,
	evalCmd: string,
	context: Context,
	file: string,
	cb: (err: Error | null, result: any) => void
): void {
	// Always return 3 :)
	cb(null, 3);
}

async function connectToPico(this: repl.REPLServer, text: string): Promise<void> {
	const unknownArgs: string[] = [];
	const args = minimist(text.split(' '), {
		boolean: ["local"],
		unknown: (arg: string) => { if (arg) unknownArgs.push(arg); return false; }
	});

	if (unknownArgs.length > 0) {
		console.error("Unknown arguement(s): ", unknownArgs);
		this.displayPrompt();
		return;
	}

	if (connection !== null) {
		console.error("Already connected, run .disconnect close current connection first");
		this.displayPrompt();
		return;
	}

	console.log("Connecting ... ");

	const localPath = process.env.PSJ_LOCAL;
	if (args.local && localPath) {
		console.log('Connecting to local process at %s', localPath);
		connection = new LocalProcessPicoSdkJsEngineConnection(localPath);
		await connection.open();
	} else {
		console.error("Serial connections not yet supported.");
	}

	this.displayPrompt();
}

async function disconnectFromPico(this: repl.REPLServer, text: string): Promise<void> {
	if (connection !== null) {
		console.log("Disconnecting ... ");
		await connection.close();
		connection = null;
	}

	this.displayPrompt()
}

async function pingPico(this: repl.REPLServer, text: string): Promise<void> {
	if (connection !== null) {
		await connection.ping();
		console.log("pong");
	}

	this.displayPrompt()
}