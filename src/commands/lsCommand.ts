import { CommandRequest, CommandResponse } from "../PicoSdkJsEngineConnection";
import { PsjReplServer } from "../psjReplServer";

export async function lsCommand(replServer: PsjReplServer, text: string): Promise<void> {
    
    const connection = replServer.getConnection();
    if (!connection) {
        throw new Error("Not connected, run .connect to connect to a device running Pico-Sdk-JS.");
    }

    const response = await connection.ls();
    
    console.log('total %d file(s)', response.value.length)
    if (response.value.length > 0) {
        console.table(response.value);
    }
}