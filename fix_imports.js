import fs from 'fs';
import path from 'path';

const currentDir = process.cwd();
const srcDir = path.join(currentDir, 'src');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            callback(dirPath);
        }
    });
}

function fixImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Replace something like features\category\Component with features/category/Component inside quotes
    const regex = /(['"])(\.?\.?\/features)\\\\?([a-zA-Z]+)\\\\?([a-zA-Z0-9_]+)(['"])/g;
    const replaced = content.replace(regex, (match, q1, prefix, category, component, q2) => {
        hasChanges = true;
        return `${q1}${prefix}/${category}/${component}${q2}`;
    });

    // Also catch other backslashes in relative imports that start with .
    const generalRegex = /from\s+(['"])(\.+)\\\\([a-zA-Z0-9_\-\\]+)(['"])/g;
    let replaced2 = replaced.replace(generalRegex, (match, q1, dots, rest, q2) => {
        hasChanges = true;
        return `from ${q1}${dots}/${rest.replace(/\\\\/g, '/')}${q2}`;
    });

    // Also lazy imports
    const lazyRegex = /import\((['"])(\.+)\\\\([a-zA-Z0-9_\-\\]+)(['"])\)/g;
    replaced2 = replaced2.replace(lazyRegex, (match, q1, dots, rest, q2) => {
        hasChanges = true;
        return `import(${q1}${dots}/${rest.replace(/\\\\/g, '/')}${q2})`;
    });

    if (hasChanges) {
        fs.writeFileSync(filePath, replaced2, 'utf8');
        console.log(`Fixed imports in ${path.relative(srcDir, filePath)}`);
    }
}

walkDir(srcDir, fixImports);
console.log('Fix script complete.');
