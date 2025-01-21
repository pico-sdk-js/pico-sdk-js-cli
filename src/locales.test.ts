//import { osLocale } from 'os-locale';

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
});
