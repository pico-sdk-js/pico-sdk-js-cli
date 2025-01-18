export interface IVersion {
    major: number;
    minor: number;
    patch: number;
}

const semVerRegex = /^(?<major>[0-9]+)\.(?<minor>[0-9]+)\.(?<patch>[0-9]+)$/;

export function parseSemVer(v: string): IVersion | null {
    const result = semVerRegex.exec(v);
    if (result) {
        return {
            major: parseInt(result[1]),
            minor: parseInt(result[2]),
            patch: parseInt(result[3])
        };
    }

    return null;
}

export function isCompatible(minVersion: string, version: string): boolean {
    const minVer = parseSemVer(minVersion);
    const curVer = parseSemVer(version);

    if (!minVer) throw new Error(`minVersion is not valid semantic version: ${minVersion}`);
    if (!curVer) throw new Error(`curVer is not valid semantic version: ${version}`);

    if (minVer.major !== curVer.major) return false;
    if (minVer.minor > curVer.minor) return false;

    return true;
}
