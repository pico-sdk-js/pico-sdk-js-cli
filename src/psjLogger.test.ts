import { LogLevel, PSJLogger } from './psjLogger';

describe('psjLogger', () => {
    describe('getMessage', () => {
        it('Constructs a valid error message', () => {
            const sut = new PSJLogger();

            const result = sut.getString({ level: LogLevel.Error, msg: 'MESSAGE' });
            expect(result).toBe('ERR: MESSAGE');
        });
    });
});
