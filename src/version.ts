const semVerRegex = /^(?<major>[0-9]+)\.(?<minor>[0-9]+)\.(?<patch>[0-9]+)$/;

export default class Version {
    public major: number;
    public minor: number;
    public patch: number;

    constructor(v: string) {
        const result = semVerRegex.exec(v);
        if (!result) {
            throw new Error(`string is not valid semantic version: ${v}`);
        }

        this.major = parseInt(result[1]);
        this.minor = parseInt(result[2]);
        this.patch = parseInt(result[3]);
    }

    isCompatible(version: Version): boolean {
        if (this.major !== version.major) return false;
        if (this.minor > version.minor) return false;

        return true;
    }

    toString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}