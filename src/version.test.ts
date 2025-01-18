import Version from './version';

describe('Version', () => {
    describe('constructor', () => {
        it('can parse normal version string', () => {
            const result = new Version('1.2.3');

            expect(result).toMatchObject({
                major: 1,
                minor: 2,
                patch: 3
            });
        });

        it('throws for invalid version string', () => {
            expect(() => {
                new Version('1');
            }).toThrowErrorMatchingSnapshot();
        });
    });

    describe('toString', () => {
        it('can be auto-converted to version string', () => {
            const version = new Version('1.2.3');

            const testString = `[${version}]`;
            expect(testString).toBe('[1.2.3]');
        });

        it('returns 3 parts by default', () => {
            const version = new Version('1.2.3');
            expect(version.toString()).toBe('1.2.3');
        });

        it('returns 3 parts when passed 3', () => {
            const version = new Version('1.2.3');
            expect(version.toString(3)).toBe('1.2.3');
        });

        it('returns 2 parts when passed 2', () => {
            const version = new Version('1.2.3');
            expect(version.toString(2)).toBe('1.2');
        });

        it('returns 1 part when passed 1', () => {
            const version = new Version('1.2.3');
            expect(version.toString(1)).toBe('1');
        });

        it('throws when passed an invalid parts', () => {
            const version = new Version('1.2.3');
            expect(() => {
                version.toString(0);
            }).toThrowErrorMatchingSnapshot();
        });
    });

    describe('isCompatible', () => {
        it('recognizes major versions ahead of min version is not compatible', async () => {
            const minExpectedVersion = new Version('1.0.0'); // CLI can handle { 'read', 'write' }
            const currentEngineVersion = new Version('2.0.0'); // ENGINE handles { 'readv2', 'writev2' } NOT OK

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(false);
        });

        it('recognizes major versions before of min version is not compatible', async () => {
            const minExpectedVersion = new Version('2.0.0');
            const currentEngineVersion = new Version('1.0.0');

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(false);
        });

        it('recognizes same major versions are compatible', async () => {
            const minExpectedVersion = new Version('2.0.0');
            const currentEngineVersion = new Version('2.0.0');

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes minor versions ahead of min version is compatible', async () => {
            const minExpectedVersion = new Version('1.1.0'); // CLI can handle { 'read', 'write' }
            const currentEngineVersion = new Version('1.2.0'); // ENGINE has { 'read', 'write', 'delete' } - OK

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes minor versions before of min version is not compatible', async () => {
            const minExpectedVersion = new Version('1.2.0'); // CLI can handle { 'read', 'write', 'delete' }
            const currentEngineVersion = new Version('1.1.0'); // ENGINE can handle { 'read', 'write' } - NOT OK

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(false);
        });

        it('recognizes same minor versions are compatible', async () => {
            const minExpectedVersion = new Version('1.2.0');
            const currentEngineVersion = new Version('1.2.0');

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes patch versions ahead of min version is compatible', async () => {
            const minExpectedVersion = new Version('1.1.1');
            const currentEngineVersion = new Version('1.1.2');

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes patch versions before of min version is compatible', async () => {
            const minExpectedVersion = new Version('1.1.2');
            const currentEngineVersion = new Version('1.1.1');

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(true);
        });

        it('recognizes same patch versions are compatible', async () => {
            const minExpectedVersion = new Version('1.1.2');
            const currentEngineVersion = new Version('1.1.2');

            const result = minExpectedVersion.isCompatible(currentEngineVersion);
            expect(result).toBe(true);
        });
    });
});
