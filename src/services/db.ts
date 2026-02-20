import Dexie, { Table } from 'dexie';
import { Field, StockItem, Animal, Machine, Transaction, Task, UserProfile, Notification, ProductBatch, AnimalBatch } from '../types';

export class OrivaDatabase extends Dexie {
    fields!: Table<Field>;
    stocks!: Table<StockItem>;
    animals!: Table<Animal>;
    machines!: Table<Machine>;
    transactions!: Table<Transaction>;
    tasks!: Table<Task>;
    notifications!: Table<Notification>;
    users!: Table<UserProfile>;
    animalBatches!: Table<AnimalBatch>;
    harvests!: Table<ProductBatch>;
    tiles!: Table<{
        id: string; // The tile URL
        data: Blob;
        timestamp: number;
    }>;
    syncQueue!: Table<{
        id?: number;
        operation: string;
        data: any;
        timestamp: string;
        status: 'pending' | 'syncing' | 'failed';
    }>;

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

export const db = new OrivaDatabase();
