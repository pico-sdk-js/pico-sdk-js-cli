import { addAbortListener } from 'node:events';
import pkg from '../../package.json';
import { ArgumentsCamelCase, Argv } from 'yargs';
import { availableLocales, processI18NMiddleware, t } from '../locales';

export interface ILangCommandOptions {
    lang: string;
}

export interface ICoreCommandOptions extends ILangCommandOptions {
    'skip-header': boolean;
}

function processHeaderMiddleware(args: ArgumentsCamelCase<ICoreCommandOptions>) {
    console.clear();

    if (!args.skipHeader) {
        console.log(t('process-header', pkg.name, pkg.version));
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

export function yargsSetup(yargs: Argv, defaultLocale: string) {
    const langYargs = yargs
        .option('lang', {
            type: 'string',
            hidden: true,
            default: defaultLocale,
            choices: availableLocales
        })
        .middleware(processI18NMiddleware, true);

    langYargs.parse();

    return langYargs
        .strict()
        .scriptName('psj')
        .option('skip-header', {
            type: 'boolean',
            description: t('Do not output the process header.'),
            default: false
        })
        .middleware(processHeaderMiddleware, true)
        .middleware(abortListenerMiddleware, true)
        .demandCommand()
        .epilogue(t('For more information, check out our docs on https://pico-sdk-js.github.io/'));
}
