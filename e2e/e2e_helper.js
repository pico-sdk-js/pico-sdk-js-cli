import { exec } from 'child_process';

function execAsync(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            if (stderr) {
                reject(stderr);
            }

            resolve(stdout);
        });    
    });
}

module.exports.execAsync = execAsync;