import fs from 'fs';
import path from 'path';

const currentDir = process.cwd();
const srcDir = path.join(currentDir, 'src');
const componentsDir = path.join(srcDir, 'components');
const featuresDir = path.join(srcDir, 'features');

const mapping = {
    'cultivation': [
        'CultivationView.tsx', 'FieldCard.tsx', 'FieldNotebook.tsx', 'SoilScanner.tsx',
        'PestDetection.tsx', 'IrrigationTwin.tsx', 'HarvestModal.tsx', 'RouteOptimizationModal.tsx',
        'ARFieldScouting.tsx', 'FieldRegistryModal.tsx', 'AutomationHub.tsx'
    ],
    'animals': [
        'AnimalCard.tsx', 'AnimalDetailsModal.tsx'
    ],
    'machines': [
        'MachineManager.tsx', 'MachineCockpit.tsx', 'ISOBUSBridge.tsx', 'AutoPilotService.tsx'
    ],
    'inventory': [
        'StockManager.tsx'
    ],
    'finance': [
        'FinanceManager.tsx', 'MarketPrices.tsx'
    ],
    'team': [
        'TeamManager.tsx', 'PublicClockInPortal.tsx', 'CheckInModal.tsx', 'LoneWorkerMonitor.tsx'
    ],
    'traceability': [
        'TraceabilityModal.tsx', 'TaskProofModal.tsx', 'PublicProductPage.tsx'
    ],
    'dashboard': [
        'DashboardHome.tsx', 'MissionControl.tsx', 'MorningBriefingModal.tsx', 'CarbonDashboard.tsx', 'FarmCopilot.tsx'
    ]
};

// Ensure directories exist
Object.keys(mapping).forEach(feature => {
    const dir = path.join(featuresDir, feature);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const filesToMove = {};

Object.entries(mapping).forEach(([feature, files]) => {
    files.forEach(file => {
        filesToMove[file] = `features/${feature}/${file}`;
    });
});

console.log('Moving files...');
Object.entries(filesToMove).forEach(([file, newRelativePath]) => {
    const oldPath = path.join(componentsDir, file);
    const newPath = path.join(srcDir, newRelativePath);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${file}`);
    } else {
        console.log(`Not found: ${file}`);
    }
});

console.log('Updating imports...');

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

function updateImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    Object.entries(filesToMove).forEach(([file, newRelPath]) => {
        const componentName = file.replace('.tsx', '');

        const importRegex = new RegExp(`from\\s+['"](.*?\\/?)${componentName}['"]`, 'g');
        content = content.replace(importRegex, (match, pathPrefix) => {
            const currentDir = path.dirname(filePath);
            const targetPath = path.join(srcDir, newRelPath.replace('.tsx', ''));
            let rel = path.relative(currentDir, targetPath).replace(/\\\\/g, '/');
            if (!rel.startsWith('.')) rel = './' + rel;
            hasChanges = true;
            return `from '${rel}'`;
        });

        const lazyRegex = new RegExp(`import\\(['"](.*?\\/?)${componentName}['"]\\)`, 'g');
        content = content.replace(lazyRegex, (match, pathPrefix) => {
            const currentDir = path.dirname(filePath);
            const targetPath = path.join(srcDir, newRelPath.replace('.tsx', ''));
            let rel = path.relative(currentDir, targetPath).replace(/\\\\/g, '/');
            if (!rel.startsWith('.')) rel = './' + rel;
            hasChanges = true;
            return `import('${rel}')`;
        });
    });

    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated imports in ${path.relative(srcDir, filePath).replace(/\\\\/g, '/')}`);
    }
}

walkDir(srcDir, updateImportsInFile);

console.log('Migration script complete.');
