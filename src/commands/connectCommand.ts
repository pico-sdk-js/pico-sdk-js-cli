import Yargs from "yargs/yargs";
import { PsjReplServer } from "../psjReplServer";
import { LocalProcessPicoSdkJsEngineConnection } from "../LocalProcessPicoSdkJsEngineConnection";
import { PicoSdkJsEngineConnection } from "../PicoSdkJsEngineConnection";
import { SerialPicoSdkJsEngineConnection } from "../SerialPicoSdkJsEngineConnection";


export async function connectToPico(replServer: PsjReplServer, text: string): Promise<void> {
    let failed = false;
    const yargs = Yargs(text).options({
        local: {
            alias: 'l',
            type: 'boolean',
            description: 'Starts a local process to connect to. NOTE: Must set the "PSJ_LOCAL" environment variable to the pico-sdk-js executable.',
            hidden: true
        },
        device: {
            alias: 'D',
            type: 'string',
            description: 'The device name to connect to.',
            // default: '/dev/ttyACM0'
        }
    }).fail((msg: string, err: Error) => {
        failed = true;
        console.error(msg);
        yargs.showHelp();
    }).strict().exitProcess(false);


    yargs.conflicts('local', 'device');

    yargs.example('.connect --device /dev/ttyACM0', 'connect to the "/dev/ttyACM0" device.');

    const args = await yargs.parseAsync();

    if (failed || args.help || args.version) {
        return;
    }

    if (replServer.getConnection()) {
        throw new Error("Already connected, run .disconnect close current connection first");
    }

    console.log("Connecting ... ");

    let connection: PicoSdkJsEngineConnection;
    if (args.local) {
        const localPath = process.env.PSJ_LOCAL;
        if (!localPath) {
            throw new Error("Local path not defined. Must set environment variable 'PSJ_LOCAL' to the path of the pico-sdk-js executable.");
        }

        console.log('Connecting to local process at %s', localPath);
        connection = new LocalProcessPicoSdkJsEngineConnection(localPath);
    } else {
        const device = args.device ?? '/dev/ttyACM0';
        console.log('Connecting to serial device at %s', device);
        connection = new SerialPicoSdkJsEngineConnection(device);
    }

    replServer.setConnection(connection);
    await connection.open();
}

