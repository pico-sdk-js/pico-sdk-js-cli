//import { osLocale } from 'os-locale';

import { I18n } from 'i18n';
import Version from './version.ts';

describe('locales', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    describe('getOsLocale', () => {
        it('returns os locale if available', async () => {
            jest.mock('os-locale', () => ({
                osLocale: jest.fn(() => 'es')
            }));

            const localeModule = await import('./locales.ts');

            const result = await localeModule.getOsLocale();
            expect(result).toBe('es');
        });

        it('returns partial os locale if available', async () => {
            jest.mock('os-locale', () => ({
                osLocale: jest.fn(() => 'es-ES')
            }));

            const localeModule = await import('./locales.ts');

            const result = await localeModule.getOsLocale();
            expect(result).toBe('es');
        });

        it('returns "en" if not available', async () => {
            jest.mock('os-locale', () => ({
                osLocale: jest.fn(() => 'zz')
            }));

            const localeModule = await import('./locales.ts');

            const result = await localeModule.getOsLocale();
            expect(result).toBe('en');
        });

        it('returns "en" if partial not available', async () => {
            jest.mock('os-locale', () => ({
                osLocale: jest.fn(() => 'zz-ZZ')
            }));

            const localeModule = await import('./locales.ts');

            const result = await localeModule.getOsLocale();
            expect(result).toBe('en');
        });
    });

    describe('t', () => {
        it('will return localized content from i18n', async () => {
            const i18n = new I18n();
            i18n.configure({
                locales: ['en', 'es'],
                retryInDefaultLocale: true,
                defaultLocale: 'en',
                logWarnFn: jest.fn(),
                logErrorFn: jest.fn(),
                staticCatalog: {
                    'en': {
                        'string1': 'This is my string'
                    },
                    'es': {
                        'string1': 'Este es mi string'
                    }
                }
            });

            const locales = await import('./locales.ts');
            locales.setI18n(i18n);

            const result = locales.t('string1');
            expect(result).toBe('This is my string');
        });

        it('will return default content from i18n', async () => {
            const i18n = new I18n();
            i18n.configure({
                locales: ['en', 'es'],
                retryInDefaultLocale: true,
                defaultLocale: 'en',
                logWarnFn: jest.fn(),
                logErrorFn: jest.fn(),
                staticCatalog: {
                    'en': {
                        'string1': 'This is my string'
                    },
                    'es': {
                        'string1': 'Este es mi string'
                    }
                }
            });

            const locales = await import('./locales.ts');
            locales.setI18n(i18n);

            const result = locales.t('unknown string');
            expect(result).toBe('unknown string');
        });

        it('will inject string content from i18n', async () => {
            const i18n = new I18n();
            i18n.configure({
                locales: ['en', 'es'],
                retryInDefaultLocale: true,
                defaultLocale: 'en',
                logWarnFn: jest.fn(),
                logErrorFn: jest.fn(),
                staticCatalog: {
                    'en': {
                        'string1': 'This is "%s"'
                    }
                }
            });

            const locales = await import('./locales.ts');
            locales.setI18n(i18n);

            const result = locales.t('string1', 'foo');
            expect(result).toBe('This is "foo"');
        });

        it('will inject number content from i18n', async () => {
            const i18n = new I18n();
            i18n.configure({
                locales: ['en', 'es'],
                retryInDefaultLocale: true,
                defaultLocale: 'en',
                logWarnFn: jest.fn(),
                logErrorFn: jest.fn(),
                staticCatalog: {
                    'en': {
                        'string1': 'This is "%d"'
                    }
                }
            });

            const locales = await import('./locales.ts');
            locales.setI18n(i18n);

            const result = locales.t('string1', 999);
            expect(result).toBe('This is "999"');
        });

        it('will inject version.toString content from i18n', async () => {
            const i18n = new I18n();
            i18n.configure({
                locales: ['en', 'es'],
                retryInDefaultLocale: true,
                defaultLocale: 'en',
                logWarnFn: jest.fn(),
                logErrorFn: jest.fn(),
                staticCatalog: {
                    'en': {
                        'string1': 'This is "%s"'
                    }
                }
            });

            const locales = await import('./locales.ts');
            locales.setI18n(i18n);

            const result = locales.t('string1', new Version('1.2.3'));
            expect(result).toBe('This is "1.2.3"');
        });
    })
});
