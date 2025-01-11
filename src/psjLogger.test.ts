describe('psjLogger', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    describe('log', () => {
        it('logs to the console', async () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const { LogLevel, PSJLogger } = await import('./psjLogger.ts');
            const sut = new PSJLogger();

            sut.log({ level: LogLevel.User, msg: 'MESSAGE' });

            expect(logSpy).toHaveBeenCalledWith('MESSAGE');
        });
    });

    describe('getMessage', () => {
        it('Constructs a valid error message', async () => {
            jest.mock('chalk', () => ({
                red: jest.fn((x: string) => x)
            }));

            const { LogLevel, PSJLogger } = await import('./psjLogger.ts');
            const sut = new PSJLogger();

            const result = sut.getString({ level: LogLevel.Error, msg: 'MESSAGE' });
            expect(result).toBe('ERR: MESSAGE');
        });

        it('Constructs a valid warning message', async () => {
            jest.mock('chalk', () => ({
                yellow: jest.fn((x: string) => x)
            }));

            const { LogLevel, PSJLogger } = await import('./psjLogger.ts');
            const sut = new PSJLogger();

            const result = sut.getString({ level: LogLevel.Warning, msg: 'MESSAGE' });
            expect(result).toBe('WRN: MESSAGE');
        });

        it('Constructs a valid debug message', async () => {
            jest.mock('chalk', () => ({
                green: jest.fn((x: string) => x)
            }));

            const { LogLevel, PSJLogger } = await import('./psjLogger.ts');
            const sut = new PSJLogger();

            const result = sut.getString({ level: LogLevel.Debug, msg: 'MESSAGE' });
            expect(result).toBe('DBG: MESSAGE');
        });

        it('Constructs a valid trace message', async () => {
            jest.mock('chalk', () => ({
                blue: jest.fn((x: string) => x)
            }));

            const { LogLevel, PSJLogger } = await import('./psjLogger.ts');
            const sut = new PSJLogger();

            const result = sut.getString({ level: LogLevel.Trace, msg: 'MESSAGE' });
            expect(result).toBe('TRC: MESSAGE');
        });

        it('Constructs a valid user message', async () => {
            const { LogLevel, PSJLogger } = await import('./psjLogger.ts');
            const sut = new PSJLogger();

            const result = sut.getString({ level: LogLevel.User, msg: 'MESSAGE' });
            expect(result).toBe('MESSAGE');
        });
    });
});
