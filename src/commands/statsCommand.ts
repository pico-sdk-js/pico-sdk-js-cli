import chalk from 'chalk';
import { PsjReplServer } from '../psjReplServer';

export async function statsCommand(replServer: PsjReplServer): Promise<void> {
    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error('Not connected, run .connect to connect to a device running Pico-Sdk-JS.');
    }

    const { value } = await connection.stats();

    Object.getOwnPropertyNames(value).forEach((element) => {
        console.log('  ', chalk.bold(element.padEnd(15)), ': ', value[element]);
    });
}
