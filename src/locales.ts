import { I18n } from 'i18n';
import path from 'path';
import { ArgumentsCamelCase } from 'yargs';
import { ILangCommandOptions } from './yargsCommands/coreCommand';
import { logger, LogLevel } from './psjLogger';

export const availableLocales = ['en', 'es'];

let __i18n: I18n | null = null;

export function setI18n(i18n: I18n) {
    __i18n = i18n;
}

export function getI18n(): I18n {
    if (__i18n === null) {
        const options: i18n.ConfigurationOptions = {
            locales: availableLocales,
            directory: path.join(__dirname, './locales'),
            retryInDefaultLocale: true,
            defaultLocale: 'en',
            syncFiles: false,
            updateFiles: false,
            logWarnFn(msg) {
                logger.logMsg(LogLevel.Warning, `(i18n) ${msg}`);
            },
            logErrorFn(msg) {
                logger.logMsg(LogLevel.Error, `(i18n) ${msg}`);
            }
        };
    
        __i18n = new I18n();
        __i18n.configure(options);
        __i18n.setLocale('en');
    }

    return __i18n;
}

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
    getI18n().setLocale(args.lang);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function t(phraseOrOptions: string, ...replace: any[]): string {
    const replacements = replace.map((v) => {
        if (v instanceof Object) {
            return v.toString();
        }
        
        return v;
    });

    return getI18n().__(phraseOrOptions, ...replacements);
}
