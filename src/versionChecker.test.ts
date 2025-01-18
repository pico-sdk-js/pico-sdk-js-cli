import { parseSemVer, isCompatible } from './versionChecker';

describe('versionChecker', () => {
    describe('parseSemVer', () => {
        it('can parse normal version string', () => {
            const result = parseSemVer('1.2.3');

            expect(result).not.toBeNull();
            expect(result).toMatchObject({
                major: 1,
                minor: 2,
                patch: 3
            });
        });

        it('returns null for missing part', () => {
            const result = parseSemVer('1.2');

            expect(result).toBeNull();
        });

        it('returns null invalid numbers', () => {
            const result = parseSemVer('1.-2.3');

            expect(result).toBeNull();
        });
    });

    describe('isCompatible', () => {
        it('throws for invalid min ver', async () => {
            const minExpectedVersion = '1';
            const currentEngineVersion = '1.0.0';

            expect(() => {
                isCompatible(minExpectedVersion, currentEngineVersion);
            }).toThrow(Error);
        });

        it('throws for invalid current ver', async () => {
            const minExpectedVersion = '1.0.0';
            const currentEngineVersion = '1';

            expect(() => {
                isCompatible(minExpectedVersion, currentEngineVersion);
            }).toThrow(Error);
        });

        it('recognizes major versions ahead of min version is not compatible', async () => {
            const minExpectedVersion = '1.0.0'; // CLI can handle { 'read', 'write' }
            const currentEngineVersion = '2.0.0'; // ENGINE handles { 'readv2', 'writev2' } NOT OK

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(false);
        });

        it('recognizes major versions before of min version is not compatible', async () => {
            const minExpectedVersion = '2.0.0';
            const currentEngineVersion = '1.0.0';

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(false);
        });

        it('recognizes same major versions are compatible', async () => {
            const minExpectedVersion = '2.0.0';
            const currentEngineVersion = '2.0.0';

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes minor versions ahead of min version is compatible', async () => {
            const minExpectedVersion = '1.1.0'; // CLI can handle { 'read', 'write' }
            const currentEngineVersion = '1.2.0'; // ENGINE has { 'read', 'write', 'delete' } - OK

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes minor versions before of min version is not compatible', async () => {
            const minExpectedVersion = '1.2.0'; // CLI can handle { 'read', 'write', 'delete' }
            const currentEngineVersion = '1.1.0'; // ENGINE can handle { 'read', 'write' } - NOT OK

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(false);
        });

        it('recognizes same minor versions are compatible', async () => {
            const minExpectedVersion = '1.2.0';
            const currentEngineVersion = '1.2.0';

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes patch versions ahead of min version is compatible', async () => {
            const minExpectedVersion = '1.1.1';
            const currentEngineVersion = '1.1.2';

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes patch versions before of min version is compatible', async () => {
            const minExpectedVersion = '1.1.2';
            const currentEngineVersion = '1.1.1';

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes same patch versions are compatible', async () => {
            const minExpectedVersion = '1.1.2';
            const currentEngineVersion = '1.1.2';

            const result = isCompatible(minExpectedVersion, currentEngineVersion);
            expect(result).toBe(true);
        });
    });
});
