import i18n from 'i18n';
import path from 'path';
import { ArgumentsCamelCase } from 'yargs';
import { IDebugCommandOptions } from './yargsCommands/coreCommand';
import { logger, LogLevel } from './psjLogger';

export const availableLocales = ['en', 'es'];

export async function getOsLocale(): Promise<string> {
    const { osLocale } = await import('os-locale');
    let osLanguage = await osLocale();

    if (availableLocales.includes(osLanguage)) {
        return osLanguage;
    }

    const idx = osLanguage.indexOf('-');
    if (idx >= 0) {
        osLanguage = osLanguage.substring(0, idx);

        if (availableLocales.includes(osLanguage)) {
            return osLanguage;
        }
    }

    return 'en';
}

export function processI18NMiddleware(args: ArgumentsCamelCase<IDebugCommandOptions>) {
    const options: i18n.ConfigurationOptions = {
        locales: availableLocales,
        directory: path.join(__dirname, './locales'),
        retryInDefaultLocale: true,
        defaultLocale: args.lang,
        logDebugFn(msg) {
            logger.logMsg(LogLevel.Debug, `(i18n) ${msg}`);
        },
        logWarnFn(msg) {
            logger.logMsg(LogLevel.Warning, `(i18n) ${msg}`);
        },
        logErrorFn(msg) {
            logger.logMsg(LogLevel.Error, `(i18n) ${msg}`);
        }
    };

    if (args.debug) {
        options.directory = path.join(__dirname, '../src/locales');
        options.updateFiles = true;
        options.syncFiles = true;
    }

    i18n.configure(options);
}

export function t(phraseOrOptions: string, ...replace: string[]): string {
    return i18n.__(phraseOrOptions, ...replace);
}
