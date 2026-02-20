import * as Comlink from 'comlink';
import Dexie from 'dexie';

// Re-declare the DB interface simplified for the worker
class WorkerDatabase extends Dexie {
    syncQueue!: Dexie.Table<any, number>;
    // Extend as needed for other tables the worker touches

    constructor() {
        super('OrivaSmartDB');
        this.version(2).stores({
            fields: 'id, name, crop',
            stocks: 'id, name, category',
            animals: 'id, tagId, name',
            machines: 'id, name, plate',
            transactions: 'id, date, type',
            tasks: 'id, title, date, assignedTo',
            notifications: 'id, timestamp, read',
            users: 'id, name, role',
            animalBatches: 'id, name, species',
            harvests: 'batchId, crop, harvestDate',
            tiles: 'id',
            syncQueue: '++id, operation, timestamp, status'
        });
    }
}

const db = new WorkerDatabase();

export class DataSyncWorker {
    /**
     * Heavy Background Task: Insert 100k records without blocking the main thread
     * @param count Number of mock records to insert
     * @param onProgress Callback to report progress to the main thread
     */
    async stressTestInsert(count: number, onProgress: (msg: string) => void): Promise<void> {
        onProgress(`A iniciar geração de ${count} registos fantasma...`);

        const BATCH_SIZE = 10000;
        const totalBatches = Math.ceil(count / BATCH_SIZE);
        let inserted = 0;

        for (let i = 0; i < totalBatches; i++) {
            const batchCount = Math.min(BATCH_SIZE, count - inserted);
            const mockRecords = Array.from({ length: batchCount }, (_, idx) => ({
                operation: 'STRESS_TEST_MOCK_LOG',
                data: {
                    sensorId: `sensor-${Math.floor(Math.random() * 1000)}`,
                    value: Math.random() * 100,
                    note: `Leitura histórica #${inserted + idx}`
                },
                timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                status: 'pending' as const
            }));

            // Bulk put in Dexie (Dexie handles transactions natively in the worker)
            await db.syncQueue.bulkAdd(mockRecords);

            inserted += batchCount;
            onProgress(`Sincronizando ${inserted.toLocaleString('pt-PT')} registos no Background...`);

            // Artificial delay to mimic slow heavy processing and let UI breathe
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        onProgress('Sincronização concluída com sucesso!');
    }

    /**
     * Clears all stress test records to clean up
     */
    async clearStressTestData(onProgress: (msg: string) => void): Promise<void> {
        onProgress('A limpar dados de teste...');
        await db.syncQueue.where('operation').equals('STRESS_TEST_MOCK_LOG').delete();
        onProgress('Dados Edge Computing limpos!');
    }
}

Comlink.expose(new DataSyncWorker());
