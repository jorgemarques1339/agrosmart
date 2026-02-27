import { exec } from 'child_process';
import fs from 'fs';
exec('npm run build', (error, stdout, stderr) => {
    fs.writeFileSync('build_debug.log', `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`);
    console.log('done');
});
