import i18n from 'i18n';
import path from 'path';
import { ArgumentsCamelCase } from 'yargs';
import { ILangCommandOptions } from './yargsCommands/coreCommand';
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

export function processI18NMiddleware(args: ArgumentsCamelCase<ILangCommandOptions>) {
    const options: i18n.ConfigurationOptions = {
        locales: availableLocales,
        directory: path.join(__dirname, './locales'),
        retryInDefaultLocale: true,
        defaultLocale: 'en',
        logWarnFn(msg) {
            logger.logMsg(LogLevel.Warning, `(i18n) ${msg}`);
        },
        logErrorFn(msg) {
            logger.logMsg(LogLevel.Error, `(i18n) ${msg}`);
        }
    };

    i18n.configure(options);
    i18n.setLocale(args.lang);
}

export function t(phraseOrOptions: string, ...replace: string[]): string {
    return i18n.__(phraseOrOptions, ...replace);
}
