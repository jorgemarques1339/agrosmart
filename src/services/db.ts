import Dexie, { Table } from 'dexie';
import { Field, StockItem, Animal, Machine, Transaction, Task, UserProfile, Notification, ProductBatch } from '../types';

export class OrivaDatabase extends Dexie {
    fields!: Table<Field>;
    stocks!: Table<StockItem>;
    animals!: Table<Animal>;
    machines!: Table<Machine>;
    transactions!: Table<Transaction>;
    tasks!: Table<Task>;
    notifications!: Table<Notification>;
    users!: Table<UserProfile>;
    harvests!: Table<ProductBatch>;
    syncQueue!: Table<{
        id?: number;
        operation: string;
        data: any;
        timestamp: string;
        status: 'pending' | 'syncing' | 'failed';
    }>;

    constructor() {
        super('OrivaSmartDB');
        this.version(1).stores({
            fields: 'id, name, crop',
            stocks: 'id, name, category',
            animals: 'id, tagId, name',
            machines: 'id, name, plate',
            transactions: 'id, date, type',
            tasks: 'id, title, date, assignedTo',
            notifications: 'id, timestamp, read',
            users: 'id, name, role',
            harvests: 'batchId, crop, harvestDate',
            syncQueue: '++id, operation, timestamp, status'
        });
    }
}

export const db = new OrivaDatabase();
