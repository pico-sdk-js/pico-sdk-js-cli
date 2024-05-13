import { PsjReplServer } from '../psjReplServer';

export async function disconnectFromPico(replServer: PsjReplServer): Promise<void> {
    const connection = replServer.getConnection();
    if (connection) {
        console.log('Disconnecting ... ');
        await connection.close();
        replServer.setConnection(null);
    }
}
