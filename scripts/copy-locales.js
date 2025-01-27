import fs from 'node:fs'
import path from 'node:path'

const destDir = path.join(path.dirname(''), './dist/locales');
const srcDir = path.join(path.dirname(''), './src/locales');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);

for (const file of files) {
    fs.copyFileSync(
        path.join(srcDir, path.basename(file)), 
        path.join(destDir, path.basename(file))
    );
}