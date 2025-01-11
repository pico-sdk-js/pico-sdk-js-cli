import { addAbortListener } from 'node:events';
import pkg from '../../package.json';
import { ArgumentsCamelCase, Argv } from 'yargs';

export interface ICoreCommandOptions {
    'skip-header': boolean;
}

function processHeaderMiddleware(args: ArgumentsCamelCase<ICoreCommandOptions>) {
    console.clear();

    if (!args.skipHeader) {
        console.log(`
Welcome to ${pkg.name} v${pkg.version}
>> ${pkg.description}

Type ".help" for more information.`);
    }
}

async function abortListenerMiddleware() {
    if (process.channel) {
        const execa = await import('execa');
        const cancelSignal = await execa.getCancelSignal();
        addAbortListener(cancelSignal, () => {
            console.log('Abort Raised');
            process.exit(0);
        });
    }
}

export function yargsSetup(yargs: Argv) {
    return yargs
        .strict()
        .scriptName('psj')
        .option('skip-header', {
            type: 'boolean',
            description: 'Do not output the process header.',
            default: false
        })
        .middleware(processHeaderMiddleware, true)
        .middleware(abortListenerMiddleware, true)
        .demandCommand()
        .epilogue('For more information, check out our docs on https://pico-sdk-js.github.io/');
}
