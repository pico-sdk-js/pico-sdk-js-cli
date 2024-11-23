import {describe, expect, test} from '@jest/globals';
import { execAsync } from './e2e_helper';

describe('--help', () => {
    test('shows help', async () => {
        const output = await execAsync('node ./dist/index.js --help');
        expect(output).toMatch(/^^Welcome to @pico-sdk-js\/cli v([0-9]+\.[0-9]+\.[0-9]+)\n\s*>> CLI for connecting to a Raspberry Pi Pico with the Pico-SDK-JS installed/);
    });
});