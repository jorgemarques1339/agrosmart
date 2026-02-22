import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { db } from '../../services/db';
import { syncManager } from '../../services/SyncManager';
import { Animal, AnimalBatch, Transaction, Notification, FieldLog, MedicalRecord } from '../../types';

export interface AnimalSlice {
    animals: Animal[];
    animalBatches: AnimalBatch[];
    setAnimals: (animals: Animal[]) => void;
    setAnimalBatches: (batches: AnimalBatch[]) => void;
    addAnimal: (animal: Animal) => Promise<void>;
    updateAnimal: (id: string, updates: Partial<Animal>) => Promise<void>;
    addProduction: (id: string, value: number, type: 'milk' | 'weight') => Promise<void>;
    addAnimalBatch: (batch: AnimalBatch) => Promise<void>;
    updateAnimalBatch: (id: string, updates: Partial<AnimalBatch>) => Promise<void>;
    deleteAnimalBatch: (id: string) => Promise<void>;
    applyBatchAction: (batchId: string, actionType: string, description: string, details?: Partial<MedicalRecord>) => Promise<void>;
    addMedicalRecord: (animalId: string, record: Omit<MedicalRecord, 'id'>) => Promise<void>;
}

export const createAnimalSlice: StateCreator<AppState, [], [], AnimalSlice> = (set, get) => ({
    animals: [],
    animalBatches: [],

    setAnimals: (animals) => set({ animals }),
    setAnimalBatches: (animalBatches) => set({ animalBatches }),

    addAnimal: async (animal) => {
        await db.animals.add(animal);
        syncManager.addToQueue('ADD_ANIMAL', animal);
        set(state => ({ animals: [...state.animals, animal] }));
    },

    updateAnimal: async (id, updates) => {
        await db.animals.update(id, updates);
        const fullAnimal = await db.animals.get(id);
        if (fullAnimal) {
            syncManager.addToQueue('UPDATE_ANIMAL', fullAnimal);
            set(state => ({
                animals: state.animals.map(a => a.id === id ? fullAnimal : a)
            }));
        }
    },

    addProduction: async (id, value, type) => {
        const animal = get().animals.find(a => a.id === id);
        if (!animal) return;

        const record = { date: new Date().toISOString().split('T')[0], value, type };
        const updates: Partial<Animal> = {
            productionHistory: [...(animal.productionHistory || []), record],
            weight: type === 'weight' ? value : animal.weight
        };

        await db.animals.update(id, updates);
        const fullAnimal = await db.animals.get(id);
        if (fullAnimal) {
            syncManager.addToQueue('UPDATE_ANIMAL', fullAnimal);
            set(state => ({
                animals: state.animals.map(a => a.id === id ? fullAnimal : a)
            }));
        }
    },

    addAnimalBatch: async (batch) => {
        await db.animalBatches.add(batch);
        syncManager.addToQueue('ADD_ANIMAL_BATCH', batch);
        set(state => ({ animalBatches: [...state.animalBatches, batch] }));
    },

    updateAnimalBatch: async (id, updates) => {
        await db.animalBatches.update(id, updates);
        const fullBatch = await db.animalBatches.get(id);
        if (fullBatch) {
            syncManager.addToQueue('UPDATE_ANIMAL_BATCH', fullBatch);
            set(state => ({
                animalBatches: state.animalBatches.map(b => b.id === id ? fullBatch : b)
            }));
        }
    },

    deleteAnimalBatch: async (id) => {
        await db.animalBatches.delete(id);
        syncManager.addToQueue('DELETE_ANIMAL_BATCH', id);
        set(state => ({ animalBatches: state.animalBatches.filter(b => b.id !== id) }));
    },

    applyBatchAction: async (batchId, actionType, description, details) => {
        const batch = get().animalBatches.find(b => b.id === batchId);
        if (!batch) return;

        const medicalRecord: MedicalRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            type: (actionType.toLowerCase().includes('vacina') ? 'vaccine' : 'treatment') as any,
            description: `${actionType}: ${description}`,
            ...details
        };

        // Calculate withdrawal end date if applicable
        if (medicalRecord.withdrawalDays) {
            const endDate = new Date(medicalRecord.date);
            endDate.setDate(endDate.getDate() + medicalRecord.withdrawalDays);
            medicalRecord.withdrawalEndDate = endDate.toISOString();
        }

        const newHistory = [...(batch.history || []), {
            id: medicalRecord.id,
            date: medicalRecord.date,
            type: 'treatment',
            description: medicalRecord.description
        } as FieldLog];

        const newMedicalHistory = [...(batch.medicalHistory || []), medicalRecord];

        // Update batch
        await db.animalBatches.update(batchId, {
            history: newHistory,
            medicalHistory: newMedicalHistory,
            withdrawalEndDate: medicalRecord.withdrawalEndDate
        });

        // Also update all animals in this batch (conceptual - usually store has animals with batch reference)
        // For the sake of this demo/implementation, we update animals that belong to this batch species/name if no explicit link
        // But the types don't have an animal.batchId. Let's assume we just update the batch itself.

        syncManager.addToQueue('APPLY_BATCH_ACTION', { batchId, actionType, description, medicalRecord });

        set(state => ({
            animalBatches: state.animalBatches.map(b => b.id === batchId ? {
                ...b,
                history: newHistory,
                medicalHistory: newMedicalHistory,
                withdrawalEndDate: medicalRecord.withdrawalEndDate
            } : b)
        }));

        const notification: Notification = {
            id: `notif-batch-${Date.now()}`,
            title: `Ação em Massa: ${batch.name}`,
            message: `${actionType} aplicada. Lote em carência até ${medicalRecord.withdrawalEndDate?.split('T')[0] || 'N/A'}.`,
            type: 'info',
            timestamp: new Date().toISOString(),
            read: false
        };
        await db.notifications.add(notification);
        set(state => ({ notifications: [notification, ...state.notifications] }));
    },

    addMedicalRecord: async (animalId, record) => {
        const animal = get().animals.find(a => a.id === animalId);
        if (!animal) return;

        const medicalRecord: MedicalRecord = {
            id: Date.now().toString(),
            ...record
        };

        // Calculate withdrawal end date
        if (medicalRecord.withdrawalDays) {
            const endDate = new Date(medicalRecord.date);
            endDate.setDate(endDate.getDate() + medicalRecord.withdrawalDays);
            medicalRecord.withdrawalEndDate = endDate.toISOString();
        }

        const newMedicalHistory = [...(animal.medicalHistory || []), medicalRecord];

        // Find most restrictive withdrawalEndDate among all medical records
        const activeWithdrawals = newMedicalHistory
            .filter(r => r.withdrawalEndDate && new Date(r.withdrawalEndDate) > new Date())
            .map(r => r.withdrawalEndDate!);

        const withdrawalEndDate = activeWithdrawals.length > 0
            ? activeWithdrawals.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
            : undefined;

        await db.animals.update(animalId, {
            medicalHistory: newMedicalHistory,
            withdrawalEndDate
        });

        const fullAnimal = await db.animals.get(animalId);
        if (fullAnimal) {
            syncManager.addToQueue('UPDATE_ANIMAL', fullAnimal);
            set(state => ({
                animals: state.animals.map(a => a.id === animalId ? fullAnimal : a)
            }));
        }
    },
});
