import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');
const featuresDir = path.join(srcDir, 'features');

const componentsMoved = {
    'CultivationView.tsx': 'features/cultivation',
    'FieldCard.tsx': 'features/cultivation',
    'FieldNotebook.tsx': 'features/cultivation',
    'SoilScanner.tsx': 'features/cultivation',
    'PestDetection.tsx': 'features/cultivation',
    'IrrigationTwin.tsx': 'features/cultivation',
    'HarvestModal.tsx': 'features/cultivation',
    'RouteOptimizationModal.tsx': 'features/cultivation',
    'ARFieldScouting.tsx': 'features/cultivation',
    'FieldRegistryModal.tsx': 'features/cultivation',
    'AutomationHub.tsx': 'features/cultivation',
    'AnimalCard.tsx': 'features/animals',
    'AnimalDetailsModal.tsx': 'features/animals',
    'MachineManager.tsx': 'features/machines',
    'MachineCockpit.tsx': 'features/machines',
    'ISOBUSBridge.tsx': 'features/machines',
    'AutoPilotService.tsx': 'features/machines',
    'StockManager.tsx': 'features/inventory',
    'FinanceManager.tsx': 'features/finance',
    'MarketPrices.tsx': 'features/finance',
    'TeamManager.tsx': 'features/team',
    'PublicClockInPortal.tsx': 'features/team',
    'CheckInModal.tsx': 'features/team',
    'LoneWorkerMonitor.tsx': 'features/team',
    'TraceabilityModal.tsx': 'features/traceability',
    'TaskProofModal.tsx': 'features/traceability',
    'PublicProductPage.tsx': 'features/traceability',
    'DashboardHome.tsx': 'features/dashboard',
    'MissionControl.tsx': 'features/dashboard',
    'MorningBriefingModal.tsx': 'features/dashboard',
    'CarbonDashboard.tsx': 'features/dashboard',
    'FarmCopilot.tsx': 'features/dashboard'
};

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

function fixImportsInFeatureFiles(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Upgrading `../store` -> `../../store` etc
    content = content.replace(/(['"])\.\.\/(store|hooks|services|types|utils|workers)(['"\/])/g, (match, q1, folder, rem) => {
        hasChanges = true;
        return `${q1}../../${folder}${rem}`;
    });

    content = content.replace(/(from\s+['"]|import\(['"])(\.\/)([a-zA-Z0-9_\-]+)(['"]|['"]\))/g, (match, prefix, pathPrefix, compName, suffix) => {
        if (filePath.endsWith(compName + '.tsx') || filePath.endsWith(compName + '.ts')) return match;

        const fileName = compName + '.tsx';
        const targetFeature = componentsMoved[fileName];

        if (targetFeature) {
            const currentFeature = 'features/' + path.basename(path.dirname(filePath));
            if (currentFeature === targetFeature) {
                // Same feature, it's ./ but we might need to update from `../components/`? No, original was `./`
                return match; // Nothing to change if it's already ./
            } else {
                hasChanges = true;
                const targetFolder = targetFeature.split('/')[1];
                return `${prefix}../${targetFolder}/${compName}${suffix}`;
            }
        } else {
            hasChanges = true;
            return `${prefix}../../components/${compName}${suffix}`;
        }
    });

    content = content.replace(/(from\s+['"]|import\(['"])(\.\/)ui\/([a-zA-Z0-9_\-]+)(['"]|['"]\))/g, (match, prefix, pathPrefix, compName, suffix) => {
        hasChanges = true;
        return `${prefix}../../components/ui/${compName}${suffix}`;
    });

    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${path.basename(filePath)}`);
    }
}

walkDir(featuresDir, fixImportsInFeatureFiles);
console.log('Done.');
